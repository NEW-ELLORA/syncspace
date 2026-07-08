import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const decryptPayload = (payloadHex: string, secretHex: string) => {
  const parts = payloadHex.split(':');
  if (parts.length < 2) throw new Error("Invalid payload format");
  const ivHex = parts[0];
  const cipherHex = parts.slice(1).join(':');

  const key = CryptoJS.enc.Hex.parse(secretHex);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Hex.parse(cipherHex)
  });

  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const str = decrypted.toString(CryptoJS.enc.Utf8);
  if (!str) throw new Error("Decryption failed. Bad secret key.");
  return str;
};

export const encryptPayload = (jsonString: string, secretHex: string) => {
  const key = CryptoJS.enc.Hex.parse(secretHex);
  const iv = CryptoJS.lib.WordArray.random(16);
  
  const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const ivStr = iv.toString(CryptoJS.enc.Hex);
  const encStr = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  return `${ivStr}:${encStr}`;
};

export const pullSyncData = async (endpoint: string, secret: string) => {
  const res = await fetch(`${endpoint}/api/sync`);
  if (!res.ok) throw new Error("Failed to reach Desktop Server");
  const data = await res.json();
  if (!data.payload) throw new Error("No encrypted payload received");
  
  const decryptedString = decryptPayload(data.payload, secret);
  const dbDump = JSON.parse(decryptedString);
  
  await AsyncStorage.setItem('syncspace_db', JSON.stringify(dbDump));
  return dbDump;
};

export const pushSyncData = async (endpoint: string, secret: string, changes: any) => {
  const payloadString = JSON.stringify(changes);
  const encrypted = encryptPayload(payloadString, secret);
  
  const res = await fetch(`${endpoint}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: encrypted })
  });
  if (!res.ok) throw new Error("Failed to push changes to Desktop");
  
  // Clear outbox on success
  await AsyncStorage.setItem('syncspace_outbox', '[]');
  return await res.json();
};
