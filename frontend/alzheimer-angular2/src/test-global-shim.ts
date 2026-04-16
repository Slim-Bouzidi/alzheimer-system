/*
 * Karma browser shim for libraries expecting Node-like `global`.
 * This is test-only and does not affect runtime bundles.
 */
declare global {
  interface Window {
    global?: Window;
  }
}

if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

export {};
