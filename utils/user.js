import axios from "axios";
import nacl from "tweetnacl";
import base58 from "bs58";
import crypto from "crypto";

export const getToken = () => {
  const cookies = document.cookie.split("; ");
  for (let cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === "token") {
      return decodeURIComponent(value);
    }
  }
  return null; // Return null if the cookie is not found
};

export const getUser = async () => {
  try {
    const res = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/api/me", {
      withCredentials: true,
    });
    return res.data.data;
  } catch (error) {
    return null;
  }
};

const encryptPrivateKey = (privateKey, password) => {
  const keybytes = Buffer.from(password, "ascii");
  if (keybytes.length > 32 || keybytes.length < 1) {
    throw new Error("Password must be between 1 and 32 bytes long");
  }
  const paddedKeyBytes = Buffer.concat([keybytes], 32);
  const iv = crypto.randomBytes(16); // Generate a random IV
  const cipher = crypto.createCipheriv("aes-256-cbc", paddedKeyBytes, iv);
  const encrypted = cipher.update(privateKey, "utf8", "hex") + cipher.final("hex");
  // Combine the IV and encrypted data for storage
  return iv.toString("hex") + ":" + encrypted;
};

const decryptPrivateKey = (encryptedData, password) => {
  const keybytes = Buffer.from(password, "ascii");
  if (keybytes.length > 32 || keybytes.length < 1) {
    throw new Error("Password must be between 1 and 32 bytes long");
  }
  const paddedKeyBytes = Buffer.concat([keybytes], 32);
  // Split the IV and encrypted data
  const [ivHex, encryptedPrivateKey] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", paddedKeyBytes, iv);
  return decipher.update(encryptedPrivateKey, "hex", "utf8") + decipher.final("utf8");
};

const openDatabase = (dbName, storeName) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, {
          keyPath: "publicKey",
          autoIncrement: true,
        });
        store.createIndex("publicKey", "publicKey", { unique: true });
      }
    };

    request.onsuccess = function (event) {
      resolve(event.target.result);
    };

    request.onerror = function (event) {
      reject("Error opening database: " + event.target.error);
    };
  });
};

const addData = (db, storeName, data) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = function () {
      resolve("Data added successfully");
    };

    request.onerror = function (event) {
      reject("Error adding data: " + event.target.error);
    };
  });
};

const getAllData = (db, storeName) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = function (event) {
      resolve(event.target.result);
    };

    request.onerror = function (event) {
      reject("Error fetching data: " + event.target.error);
    };
  });
};

// Generate a new keypair and store it in indexedDB
export const generateKeypair = async (password) => {
  const pair = nacl.sign.keyPair();
  const publicKey = base58.encode(pair.publicKey);
  const privateKey = base58.encode(pair.secretKey.slice(0, 32));

  // Encrypt the private key with the password
  const encryptedPrivateKey = encryptPrivateKey(privateKey, password);

  // Store the keypair in indexedDB
  const db = await openDatabase("residentity", "keypairs");
  await addData(db, "keypairs", { publicKey, encryptedPrivateKey });

  return { publicKey, privateKey: encryptedPrivateKey };
};

// Get the private key from indexedDB and decrypt it
export const getPrivateKey = async (publicKey, password) => {
  const db = await openDatabase("residentity", "keypairs");
  const records = await getAllData(db, "keypairs");

  for (let record of records) {
    if (record.publicKey === publicKey) {
      const privateKey = decryptPrivateKey(record.encryptedPrivateKey, password);
      return privateKey;
    }
  }

  throw new Error("No private key found for the given public key");
};
