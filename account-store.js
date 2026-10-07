/* Local demonstration storage. This is not production authentication.
   Only a salted PBKDF2 verifier is saved, never the password itself. */
(() => {
  'use strict';
  const KEY = 'thecups.demo.v2';
  const ITERATIONS = 120000;
  const empty = () => ({version: 2, language: 'EN', sessionId: null, accounts: []});
  const fail = key => { throw new Error(key); };
  function validAccount(a) {
    return a && typeof a.id === 'string' && typeof a.email === 'string' &&
      typeof a.firstName === 'string' && typeof a.lastName === 'string' &&
      /^[a-f0-9]{32}$/.test(a.salt) && /^[a-f0-9]{64}$/.test(a.passwordHash) &&
      a.preferences && typeof a.preferences === 'object' &&
      Array.isArray(a.preferences.diet) && typeof a.preferences.marketing === 'boolean' &&
      Array.isArray(a.favorites) && a.favorites.every(id => typeof id === 'string') &&
      Number.isSafeInteger(a.stamps) && a.stamps >= 0 &&
      Array.isArray(a.orders) && a.orders.every(o => o && typeof o.number === 'string' &&
        Number.isFinite(Date.parse(o.createdAt)) && typeof o.time === 'string' &&
        typeof o.location === 'string' && Array.isArray(o.items) &&
        o.items.every(i => i && typeof i.id === 'string' && Number.isFinite(i.price) &&
          i.price >= 0 && Number.isInteger(i.qty) && i.qty > 0));
  }
  function read() {
    let raw;
    try { raw = localStorage.getItem(KEY); } catch { fail('account.storageError'); }
    if (!raw) return empty();
    let state;
    try { state = JSON.parse(raw); } catch { fail('account.storageCorrupt'); }
    if (!state || state.version !== 2 || !Array.isArray(state.accounts) ||
        !state.accounts.every(validAccount) ||
        !['EN','PT','DE'].includes(state.language) ||
        !(state.sessionId === null || typeof state.sessionId === 'string')) fail('account.storageCorrupt');
    return state;
  }
  let state = empty();
  let error = null;
  try { state = read(); } catch (e) { error = e.message; }
  function commit(change) {
    // Re-read before writing so another tab's completed changes are retained.
    const next = read();
    change(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { fail('account.storageError'); }
    state = next;
    error = null;
    return state;
  }
  function refresh() {
    try { state = read(); error = null; } catch (e) { error = e.message; }
    return state;
  }
  const bytesToHex = bytes => Array.from(bytes, n => n.toString(16).padStart(2,'0')).join('');
  function salt() {
    if (!window.crypto?.subtle) fail('account.cryptoError');
    return bytesToHex(window.crypto.getRandomValues(new Uint8Array(16)));
  }
  async function hash(password, saltHex) {
    if (!window.crypto?.subtle) fail('account.cryptoError');
    const saltBytes = Uint8Array.from(saltHex.match(/../g), h => parseInt(h,16));
    const key = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await window.crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:saltBytes, iterations:ITERATIONS}, key, 256);
    return bytesToHex(new Uint8Array(bits));
  }
  window.CupsStore = {
    KEY, read, commit, refresh, salt, hash,
    get state() { return state; },
    get error() { return error; },
    get user() { return state.accounts.find(a => a.id === state.sessionId) || null; }
  };
})();
