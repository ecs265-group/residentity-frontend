"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import * as pdfjsLib from "pdfjs-dist";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import base58 from "bs58";
import nacl from "tweetnacl";
import { getPrivateKey, getToken } from "@/utils/user";
import { ThreeDots as Loader } from "@/components/loaders";

nacl.sign.detached.verify = nacl.sign.detached.verify.bind(nacl.sign);
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.js`;

export default function PdfViewer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const [pageLoading, setPageLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [buttonEnabled, setButtonEnabled] = useState(false);

  const fulfillTxn = async (preparedTokenTx, privateKey) => {
    // Utility function to encode length in DER format
    const encodeLength = (length) => {
      if (length < 128) {
        return Buffer.from([length]);
      } else if (length < 256) {
        return Buffer.from([0x81, length]);
      } else if (length < 65536) {
        const buf = Buffer.alloc(3);
        buf[0] = 0x82;
        buf.writeUInt16BE(length, 1);
        return buf;
      } else {
        throw new Error("Something went wrong. Please try again later.");
      }
    };

    // Function to encode an octet string with the given tag
    const encodeOctetString = (tag, value) => {
      const length = encodeLength(value.length);
      return Buffer.concat([Buffer.from([tag]), length, Buffer.from(value)]);
    };

    // Function to encode a sequence of components with a given tag
    const encodeSequence = (tag, components) => {
      const content = Buffer.concat(components);
      const length = encodeLength(content.length);
      return Buffer.concat([Buffer.from([tag]), length, content]);
    };

    // Function to serialize a custom binary format (ASN.1 DER)
    const serializeBinaryCustom = (payload) => {
      if (!payload.publicKey || !payload.signature) {
        throw new Error("Something went wrong. Please try again later.");
      }

      const publicKey = encodeOctetString(0x80, payload.publicKey);
      const signature = encodeOctetString(0x81, payload.signature);
      return encodeSequence(0xa4, [publicKey, signature]);
    };

    // Generate public key from private key
    const genPublicKey = (privateKey) => {
      const decodedPrivateKey = base58.decode(privateKey);
      const keyPair = nacl.sign.keyPair.fromSeed(decodedPrivateKey.slice(0, 32));
      return base58.encode(Buffer.from(keyPair.publicKey));
    };

    // Remove the fulfillment field from transaction inputs
    const removeFulfillment = (tx) => {
      return {
        ...tx,
        inputs: tx.inputs.map((input) => ({
          ...input,
          fulfillment: null,
        })),
      };
    };

    // Recursively sort object keys for consistent ordering
    const sortObjectKeys = (obj) => {
      if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
        const sortedObj = {};
        Object.keys(obj)
          .sort()
          .forEach((key) => {
            sortedObj[key] = sortObjectKeys(obj[key]); // Recursively sort nested objects
          });
        return sortedObj;
      } else if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys); // Handle arrays by sorting their elements recursively
      }
      return obj; // Primitive values remain unchanged
    };

    // Convert transaction object to a sorted JSON string
    const stringSerialize = (txn) => {
      return JSON.stringify(sortObjectKeys(txn));
    };

    const computeHash = async (message) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      return new Uint8Array(hashBuffer);
    };

    // Sign a transaction input with the private key for the public key
    const signatureFulfillment = async (input, message, keyPairMap) => {
      const publicKey = input.owners_before[0];
      const hashedMessage = await computeHash(message);
      const privateKey = base58.decode(keyPairMap[publicKey]);

      if (!privateKey) {
        throw new Error(`Public key ${publicKey} is not a pair with your private key`);
      }

      const generatedKeyPair = nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32));
      const signature = nacl.sign.detached(hashedMessage, generatedKeyPair.secretKey);

      const asn1DictPayload = {
        publicKey: generatedKeyPair.publicKey,
        signature: signature,
      };

      input.fulfillment = Buffer.from(serializeBinaryCustom(asn1DictPayload))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      return input;
    };

    const publicKey = genPublicKey(privateKey);
    const keyPair = { [publicKey]: privateKey };

    // Remove fulfillment from transaction and prepare inputs
    const txnWithoutFulfillmentStr = stringSerialize(removeFulfillment(preparedTokenTx));
    const inputsPromises = preparedTokenTx.inputs.map((input) =>
      signatureFulfillment(input, txnWithoutFulfillmentStr, keyPair)
    );

    preparedTokenTx.inputs = await Promise.all(inputsPromises);

    // Make the document digest as the transaction ID
    preparedTokenTx.id = preparedTokenTx.asset.data.document_digest;

    return preparedTokenTx;
  };

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?returnTo=/sign");
      return;
    }

    const fileUrl = searchParams.get("fileUrl");
    if (fileUrl) {
      router.replace("/sign", undefined, { shallow: true });
    }
    setPageLoading(false);
  }, []);

  // Clean up the Object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  useEffect(() => {
    if (pathname === "/sign" && !searchParams.get("fileUrl")) {
      setFileUrl(null);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (file) {
        const message =
          "You have unsaved changes. If you refresh the page, you will lose the file.";
        event.returnValue = message; // Standard for most browsers
        return message; // For some browsers (like Firefox)
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [file]);

  useEffect(() => {
    if (password && password.length >= 8) {
      setButtonEnabled(true);
    } else {
      setButtonEnabled(false);
    }
  }, [password]);

  const onFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      alert("Please select a PDF file.");
      return;
    }
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setFileUrl(url);
    router.push(`/sign?fileUrl=${encodeURIComponent(url)}`);
  };

  const initialSign = async () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sign/initial`;
    const payload = {
      password,
    };
    try {
      const res = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return res.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "An error occurred. Please try again later."
      );
    }
  };

  const prepareSign = async () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sign/prepare`;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });
      return res.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "An error occurred. Please try again later."
      );
    }
  };

  const commitSign = async (publicKey, preparedTokenTx) => {
    const privateKey = await getPrivateKey(publicKey, password);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sign/commit`;
    const payload = await fulfillTxn(preparedTokenTx, privateKey);
    try {
      const res = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        responseType: "blob",
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "An error occurred. Please try again later."
      );
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      setStatus("Initializing sign process...");
      const { public_key: publicKey } = await initialSign();
      setStatus("Signing in progress...");
      const preparedTokenTx = await prepareSign();
      setStatus("Committing sign...");
      const documentBlob = await commitSign(publicKey, preparedTokenTx);
      setStatus("Sign successful!");
      setLoading(false);
      const blobUrl = URL.createObjectURL(documentBlob);
      window.open(blobUrl, "_blank");
    } catch (error) {
      setError(error.message);
      setStatus(null);
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className='flex justify-center mt-2'>
        <Loader />
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className='flex items-center justify-center p-4 pt-20'>
        <div className='flex flex-col items-center justify-center bg-c0 shadow-md rounded-lg max-w-xl w-full p-6'>
          <h1 className='text-3xl font-bold text-white mb-4 text-center'>E-sign Your Document</h1>
          <h2 className='text-lg text-c2 mb-4 text-center'>Upload a PDF document for signing</h2>
          <label
            htmlFor='upload-pdf'
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border border-c2 bg-c0 shadow-sm hover:bg-white hover:text-c0 h-9 px-4 py-2 cursor-pointer'
          >
            Upload PDF
          </label>
          <input
            id='upload-pdf'
            type='file'
            accept='.pdf'
            onChange={onFileChange}
            className='hidden'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='w-4/5 mx-auto flex flex-row items-center justify-between gap-4 pt-20'>
      <div className='mt-20 mx-auto w-2/6 flex flex-col items-center justify-center text-center border bg-c0 gap-4 rounded-lg border-white/15 p-12'>
        <p className='text-white text-sm'>Enter your password to sign the document</p>
        <input
          type='password'
          placeholder='Enter your password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='mt-4 p-2 rounded-md text-white bg-c0 border border-white/15 placeholder-c2/50 text-sm focus:outline-none'
        />
        <button
          disabled={!buttonEnabled}
          onClick={handleSubmit}
          className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border border-c2 bg-c0 shadow-sm hover:bg-white hover:text-c0 h-9 px-4 py-2 cursor-pointer disabled:bg-c1 disabled:text-c2 disabled:cursor-not-allowed'
        >
          Sign
        </button>
        {loading ? (
          <div className='flex justify-center mt-2'>
            <Loader />
          </div>
        ) : null}
        {error ? <div className='text-red-500/90 text-sm text-center'>{error}</div> : null}
        {status ? <div className='text-green-500/90 text-sm text-center'>{status}</div> : null}
      </div>
      <div className='pdf-viewer w-2/3 border border-white/15 bg-c0 rounded-md p-4 shadow-md max-h-[600px] overflow-auto text-center'>
        <h2 className='text-white text-2xl font-semibold mb-1 flex items-center justify-between'>
          Preview
        </h2>
        <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
      </div>
    </div>
  );
}
