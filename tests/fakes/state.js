// Shared in-memory backend for the fakes. Hung off window so a "page reload"
// (new React root in the same window) sees the same accounts and documents,
// the way a real Firebase project would.
export function backend() {
  if (!globalThis.__FAKE_FB__) {
    globalThis.__FAKE_FB__ = {
      accounts: new Map(),   // email -> { uid, email, password, displayName }
      currentUid: null,
      docs: new Map(),       // "collection/id" -> data
      seq: 0,
      denied: [],            // rule rejections, for assertions
    }
  }
  return globalThis.__FAKE_FB__
}
export const nextId = (p) => `${p}_${++backend().seq}`
export function fbError(code, message) {
  const e = new Error(message || code)
  e.code = code
  return e
}
