// Client forms are kept in this public repository only in sealed form:
// encrypted with AES-256-GCM under a key that is never in the repository.
// The Worker holds the key (secret ONBOARD_KEY) and opens a form only for its
// passcode (secret ONBOARD_PASSCODES). tools/client-seal.mjs seals with the
// same code, loaded directly by Node, so this file uses only syntax Node can
// strip and imports nothing.

export interface Sealed {
  /** Format version. */
  v: 1;
  /** The form's id, the part of the link after #. Bound to the ciphertext, so a sealed file cannot be swapped for another id. */
  id: string;
  /** Base64: the 12-byte nonce, then the ciphertext with its tag. */
  iv: string;
  data: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

const fromB64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (b: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
};

async function importKey(keyB64: string, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  const raw = fromB64(keyB64.trim());
  if (raw.length !== 32) throw new Error('The onboarding key must be 32 bytes, in base64.');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [usage]);
}

/** Seal a form's JSON text under the key. */
export async function seal(id: string, json: string, keyB64: string): Promise<Sealed> {
  const key = await importKey(keyB64, 'encrypt');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(id) }, key, enc.encode(json)));
  return { v: 1, id, iv: toB64(iv), data: toB64(data) };
}

/** Open a sealed form. Throws if the key is wrong or the file was changed. */
export async function open(sealed: Sealed, keyB64: string): Promise<string> {
  const key = await importKey(keyB64, 'decrypt');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(sealed.iv), additionalData: enc.encode(sealed.id) }, key, fromB64(sealed.data));
  return dec.decode(plain);
}

/**
 * Compare a typed passcode with the stored one in constant time (both are hashed
 * first, so length leaks nothing). Capitals, spaces and dashes do not count, so
 * "abcd efgh" typed as "ABCDEFGH" or "abcd-efgh" still opens the form.
 */
export async function passcodeMatches(typed: string, stored: string): Promise<boolean> {
  const norm = (s: string) => enc.encode(s.toLowerCase().replace(/[\s\-‐-―]+/g, ''));
  const [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', norm(typed)), crypto.subtle.digest('SHA-256', norm(stored))]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0 && stored.trim() !== '';
}

/** A new random key, base64. */
export function newKey(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(32)));
}
