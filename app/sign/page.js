"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import * as pdfjsLib from "pdfjs-dist";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import crypto from "crypto";
import base58 from "bs58";
import nacl from "tweetnacl";

nacl.sign.detached.verify = nacl.sign.detached.verify.bind(nacl.sign);
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.js`;

export default function PdfViewer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const [fileUrl, setFileUrl] = useState(null);

  const fulfillTxn = (preparedTokenTx, privateKey) => {
    // Empty function for button click
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
      const decodedPrivateKey = base58.default.decode(privateKey);
      const keyPair = nacl.sign.keyPair.fromSeed(
        decodedPrivateKey.slice(0, 32)
      );
      return base58.default.encode(Buffer.from(keyPair.publicKey));
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

    // Sign a transaction input with the private key for the public key
    const signatureFulfillment = (input, message, keyPairMap) => {
      const publicKey = input.owners_before[0];
      const hashedMessage = crypto
        .createHash("sha3-256")
        .update(message)
        .digest();
      const privateKey = base58.default.decode(keyPairMap[publicKey]);

      if (!privateKey) {
        throw new Error(
          `Public key ${publicKey} is not a pair with your private key`
        );
      }

      const generatedKeyPair = nacl.sign.keyPair.fromSeed(
        privateKey.slice(0, 32)
      );
      const signature = nacl.sign.detached(
        hashedMessage,
        generatedKeyPair.secretKey
      );

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
    const txnWithoutFulfillmentStr = stringSerialize(
      removeFulfillment(preparedTokenTx)
    );
    preparedTokenTx.inputs = preparedTokenTx.inputs.map((input) =>
      signatureFulfillment(input, txnWithoutFulfillmentStr, keyPair)
    );

    // Generate the transaction ID using SHA3-256 hash
    // preparedTokenTx.id = crypto.createHash("sha3-256").update(stringSerialize(preparedTokenTx)).digest("hex");
    // make the preparedTokenTx.id as the document digest
    preparedTokenTx.id = preparedTokenTx.asset.data.document_digest;

    return preparedTokenTx;
  };

  // Clean up the Object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  useEffect(() => {
    console.log("Debug - Current Pathname:", pathname);
    console.log("Debug - Current SearchParams:", searchParams.toString());
  }, [pathname, searchParams]);

  useEffect(() => {
    if (pathname === "/sign" && !searchParams.get("fileUrl")) {
      setFileUrl(null);
    }
  }, [pathname, searchParams]);

  // setFileUrl on router ready. get fileUrl from search params
  useEffect(() => {
    const fileUrl = searchParams.get("fileUrl");
    if (fileUrl) {
      setFileUrl(fileUrl);
    }
  }, []);

  const onFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      alert("Please select a PDF file.");
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setFileUrl(url);
    // Navigate to the new route with the file URL as a query parameter
    router.push(`/sign?fileUrl=${encodeURIComponent(url)}`);
  };

  const handleSubmit = () => {
    // Empty function for button click
  };

  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-6xl text-white font-semibold p-4">
          Upload a PDF to get started
        </h1>
        <label
          htmlFor="upload-pdf"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border border-c2 bg-c0 shadow-sm hover:bg-white hover:text-c0 h-9 px-4 py-2 cursor-pointer"
        >
          Upload PDF
        </label>
        <input
          id="upload-pdf"
          type="file"
          accept=".pdf"
          onChange={onFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="w-4/5 mx-auto">
      <div className="pdf-viewer border border-gray-300 rounded-md p-4 shadow-md max-h-[600px] overflow-auto">
        <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
      </div>
      <button
        onClick={handleSubmit}
        className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border border-c2 bg-c0 shadow-sm hover:bg-white hover:text-c0 h-9 px-4 py-2"
      >
        Submit
      </button>
    </div>
  );
}
