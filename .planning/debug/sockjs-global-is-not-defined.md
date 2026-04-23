---
status: awaiting_human_verify
trigger: "Investigate issue: sockjs-global-is-not-defined"
created: 2026-04-20T00:00:00Z
updated: 2026-04-20T00:00:00Z
---

## Current Focus

hypothesis: The browser crash is fixed because the frontend now imports SockJS's browser bundle instead of the CommonJS source files that assume a bundler-provided `global` symbol.
test: Have the user load the Angular app and verify that the frontend initializes without `global is not defined` and that support-network notifications still connect normally.
expecting: No early runtime crash from `sockjs-client/lib/utils/browser-crypto.js`, and normal WebSocket initialization behavior.
next_action: Ask for real browser verification in the user's normal workflow.

## Symptoms

expected: The Angular frontend should load without runtime errors and initialize the support-network WebSocket client normally.
actual: The browser crashes early with `Uncaught ReferenceError: global is not defined` coming from `sockjs-client/lib/utils/browser-crypto.js`.
errors: `browser-crypto.js:3 Uncaught ReferenceError: global is not defined` with stack through `sockjs-client/lib/utils/random.js`, `event.js`, `transport/websocket.js`, `transport-list.js`.
reproduction: Load the Angular app in the browser; the error appears during frontend bundle execution when SockJS-related code is loaded.
started: New issue reported after recent frontend and infrastructure consolidation work. Unknown whether it worked before the recent changes.

## Eliminated

## Evidence

- timestamp: 2026-04-20T00:00:00Z
	checked: Debug knowledge base
	found: `.planning/debug/knowledge-base.md` does not exist.
	implication: No prior resolved pattern is available; investigate from source.

- timestamp: 2026-04-20T00:00:00Z
	checked: Frontend source search for SockJS/STOMP usage
	found: `src/app/services/websocket.service.ts` imports `@stomp/stompjs` and `sockjs-client`, and uses `webSocketFactory: () => new SockJS(this.wsUrl)`.
	implication: The runtime crash is likely triggered as soon as the WebSocket service code path loads the SockJS package into the browser bundle.

- timestamp: 2026-04-20T00:00:00Z
	checked: `node_modules/sockjs-client/package.json`, `lib/entry.js`, and built `dist/.../main.js`
	found: The package `main` is `./lib/entry.js`; that entry and `lib/utils/browser-crypto.js` reference bare `global`, and the built Angular browser bundle currently contains `node_modules/sockjs-client/lib/utils/browser-crypto.js` with `if (global.crypto && global.crypto.getRandomValues)`.
	implication: The frontend is bundling SockJS's CommonJS source path, which is incompatible with the current browser build because no `global` symbol is injected.

- timestamp: 2026-04-20T00:00:00Z
	checked: `src/test-global-shim.ts` and `angular.json`
	found: The project already has a test-only shim that assigns `window.global = window`, but production/development browser builds only include `zone.js` in `polyfills`.
	implication: A global shim would likely work, but it would be a broader workaround than necessary if the SockJS import can be redirected to its browser bundle.

- timestamp: 2026-04-20T00:00:00Z
	checked: Angular build after redirecting the import to `sockjs-client/dist/sockjs`
	found: `npm run build` completed successfully. The only output issues were existing CommonJS and bundle-size warnings; there were no TypeScript errors for the touched files.
	implication: The targeted import change is build-safe in the current Angular 19 setup.

- timestamp: 2026-04-20T00:00:00Z
	checked: Emitted browser bundle after the fix
	found: The rebuilt browser bundle no longer contains the raw `sockjs-client/lib/utils/browser-crypto.js` / `global.crypto` pattern that previously crashed; instead it contains the inlined browser bundle wrapper form of SockJS.
	implication: The specific `global is not defined` failure path has been removed from the generated frontend bundle.

## Resolution

root_cause: The Angular 19 frontend imported the package root `sockjs-client`, which resolves to SockJS's CommonJS source entry (`lib/entry.js`). That source path and its browser crypto helper reference bare `global`, but the current browser bundler does not inject a `global` symbol, causing an early runtime `ReferenceError` when the WebSocket service loads.
fix: Changed the Angular WebSocket service to import `sockjs-client/dist/sockjs` instead of the package root, and added a local TypeScript module declaration for that browser entry.
verification: Verified with `npm run build` in `frontend/alzheimer-angular2`; build succeeded, modified files have no diagnostics, and the rebuilt browser bundle no longer includes the crashing `sockjs-client/lib/utils/browser-crypto.js` / `global.crypto` path.
files_changed: [frontend/alzheimer-angular2/src/app/services/websocket.service.ts, frontend/alzheimer-angular2/src/types/sockjs-client-dist.d.ts]
