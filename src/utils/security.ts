/**
 * Client-Side Web Cryptography & Security Utilities
 * Zero external libraries: Uses standard browser Web Crypto API (SubtleCrypto)
 * - PBKDF2 with SHA-256 for password hashing & key derivation (100,000 iterations)
 * - AES-GCM 256-bit encryption for sensitive financial notes and data vault
 */

/**
 * Hash a password using PBKDF2 + SHA-256 with a unique random salt
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedKey))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash: hashHex, salt: saltHex };
}

/**
 * Verify a password candidate against stored hash & salt
 */
export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const salt = new Uint8Array(
      storedSalt.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const hashHex = Array.from(new Uint8Array(derivedKey))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return hashHex === storedHash;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Encrypt a text string using AES-GCM 256-bit with a password
 */
export async function encryptData(text: string, secretKeyStr: string): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretKeyStr),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  const payload = {
    iv: Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join(''),
    salt: Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join(''),
    cipher: Array.from(new Uint8Array(cipherBuffer)).map((b) => b.toString(16).padStart(2, '0')).join(''),
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Decrypt an AES-GCM encrypted payload using the secret password
 */
export async function decryptData(encryptedBase64: string, secretKeyStr: string): Promise<string> {
  try {
    const jsonStr = atob(encryptedBase64);
    const payload = JSON.parse(jsonStr);

    const iv = new Uint8Array(payload.iv.match(/.{1,2}/g)?.map((b: string) => parseInt(b, 16)) || []);
    const salt = new Uint8Array(payload.salt.match(/.{1,2}/g)?.map((b: string) => parseInt(b, 16)) || []);
    const cipher = new Uint8Array(payload.cipher.match(/.{1,2}/g)?.map((b: string) => parseInt(b, 16)) || []);

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(secretKeyStr),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error('Decryption failed: Incorrect key or corrupted payload');
  }
}
