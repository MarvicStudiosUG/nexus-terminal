// vault.js - Encrypted vault with Web Crypto API (AES-GCM)

import { add, esc } from './ui.js';

let vaultPassword = null;

export async function getVaultKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('nexus-vault-salt-2025'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function vaultEncrypt(plaintext, password) {
  const key = await getVaultKey(password);
  const enc = new TextEncoder();
  const data = enc.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data);
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode.apply(null, combined));
}

export async function vaultDecrypt(ciphertext, password) {
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const cipher = combined.slice(12);
  const key = await getVaultKey(password);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, cipher);
  return new TextDecoder().decode(plain);
}

function getVaultData() {
  return JSON.parse(localStorage.getItem('nexus_vault2') || '[]');
}

function setVaultData(data) {
  localStorage.setItem('nexus_vault2', JSON.stringify(data));
}

export async function vaultSetPassword(password) {
  if (!password || password.length < 4) {
    add('Password too short (min 4).', 'err');
    return;
  }
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const hashStr = btoa(String.fromCharCode.apply(null, new Uint8Array(hash)));
  localStorage.setItem('nexus_vault_hash', hashStr);
  vaultPassword = password;
  add('Vault password set.', 'ok');
}

export async function vaultUnlock(password) {
  const storedHash = localStorage.getItem('nexus_vault_hash');
  if (!storedHash) {
    add('No vault password set.', 'err');
    return false;
  }
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const hashStr = btoa(String.fromCharCode.apply(null, new Uint8Array(hash)));
  if (hashStr !== storedHash) {
    add('Wrong password.', 'err');
    return false;
  }
  vaultPassword = password;
  add('Vault unlocked.', 'ok');
  return true;
}

export async function vaultAdd(text) {
  if (!vaultPassword) {
    add('Vault locked.', 'err');
    return;
  }
  try {
    const cipher = await vaultEncrypt(text, vaultPassword);
    const data = getVaultData();
    data.push({ cipher: cipher, time: Date.now() });
    setVaultData(data);
    add('Added to vault.', 'ok');
  } catch (e) {
    add('Encryption error: ' + esc(e.message), 'err');
  }
}

export async function vaultList() {
  if (!vaultPassword) {
    add('Vault locked.', 'err');
    return;
  }
  const data = getVaultData();
  if (!data.length) {
    add('Vault empty.', 'info');
    return;
  }
  add('<strong>Vault entries:</strong>', 'highlight');
  for (let i = 0; i < data.length; i++) {
    try {
      const decrypted = await vaultDecrypt(data[i].cipher, vaultPassword);
      const date = new Date(data[i].time).toLocaleString();
      add('#' + (i + 1) + ' [' + date + '] ' + esc(decrypted), 'ok');
    } catch {
      add('#' + (i + 1) + ': Decryption failed', 'err');
    }
  }
}

export async function vaultDelete(index) {
  if (!vaultPassword) {
    add('Vault locked.', 'err');
    return;
  }
  const data = getVaultData();
  if (index < 1 || index > data.length) {
    add('Invalid index.', 'err');
    return;
  }
  data.splice(index - 1, 1);
  setVaultData(data);
  add('Entry deleted.', 'ok');
}

export function vaultLock() {
  vaultPassword = null;
  add('Vault locked.', 'ok');
}

// Initialize vault state from localStorage
export function vaultInit() {
  const savedHash = localStorage.getItem('nexus_vault_hash');
  if (savedHash) {
    vaultPassword = 'locked';
  }
}

vaultInit();
