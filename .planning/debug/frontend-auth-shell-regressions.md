---
status: investigating
trigger: "Investigate Angular/Keycloak frontend issues in frontend/alzheimer-angular2: only doctor test account can log in successfully; sidebar/navbar remains inconsistent across routes."
created: 2026-04-21T00:00:00Z
updated: 2026-04-21T00:26:00Z
---

## Current Focus

hypothesis: Confirmed. The live app uses AppModule/AppRoutingModule, while recent shell work also exists in an inactive standalone router tree; login failures stem from Keycloak/frontend role and client-id drift plus a dead-end post-login page for unsupported roles.
test: Consolidate evidence into exact root-cause and file-change recommendations.
expecting: Produce a precise split between code defects and environment/provisioning defects, with exact files to edit.
next_action: return confirmed diagnosis and recommended edits

## Symptoms

expected: All configured role accounts that exist in Keycloak should be able to log in and land on their correct role-based home pages. Sidebar and navbar should stay visually and positionally consistent across routes.
actual: User reports only the doctor test account can log in. Other accounts cannot. User also reports navbar/sidebar problems remain unresolved.
errors: Prior session already found frontend auth, Keycloak integration, role guards, and doctor shell inconsistencies. Current likely suspects include role extraction, route mapping, account/realm role mismatches, and per-page one-off doctor layouts.
reproduction: Try to reason from code and config first. Inspect Keycloak-related frontend code, role guard/auth service/login flow, route definitions, and shared sidebar/topbar/layout implementations.
started: Regressions remained after recent frontend patches.

## Eliminated

## Evidence

- timestamp: 2026-04-21T00:08:00Z
	checked: frontend/alzheimer-angular2/src/app/auth/auth.service.ts
	found: AuthService is a local mock implementation with hard-coded demo users and passwords, not a Keycloak-backed service.
	implication: If any code path still relies on this service, login behavior can diverge from the Keycloak integration and produce misleading role behavior.

- timestamp: 2026-04-21T00:09:00Z
	checked: frontend/alzheimer-angular2/src/app/core/guards/role.guard.ts
	found: The role guard checks both realm and resource roles, normalizes case, and excludes default Keycloak roles before logging denials.
	implication: The guard itself is not obviously doctor-only; the likely failure is upstream role naming, route data, or redirect mapping.

- timestamp: 2026-04-21T00:09:30Z
	checked: frontend/alzheimer-angular2/src/app/app.routes.ts
	found: The standalone routes file defines an AppShellComponent-based route tree unrelated to the Keycloak role routes seen in the symptom description.
	implication: The frontend likely contains parallel routing systems, so the active runtime router must be verified before concluding where the auth and shell bugs actually live.

- timestamp: 2026-04-21T00:13:00Z
	checked: frontend/alzheimer-angular2/src/main.ts, frontend/alzheimer-angular2/src/app/app.module.ts, frontend/alzheimer-angular2/src/app/app-routing.module.ts
	found: main.ts bootstraps AppModule; AppModule imports AppRoutingModule. The standalone appConfig/app.routes/AppShell path is not used by the running app.
	implication: Any prior shell fixes applied to app.routes.ts or layout/app-shell do not affect runtime behavior, which explains why the navbar/sidebar issue remained unresolved.

- timestamp: 2026-04-21T00:15:00Z
	checked: frontend/alzheimer-angular2/src/app/services/auth.service.ts, frontend/alzheimer-angular2/src/app/test-page/test-page.component.ts
	found: AuthService exposes role homes for ADMIN, DOCTOR, SOIGNANT, CAREGIVER, LIVREUR, PATIENT, but TestPageComponent shows a "Redirection" state for roleOptions.length <= 1 while only redirecting when length === 1.
	implication: Users with zero recognized role homes fall into a silent dead-end after Keycloak login, which presents as "account cannot log in" instead of surfacing missing role configuration.

- timestamp: 2026-04-21T00:18:00Z
	checked: keycloak/realm-config/alzheimer-realm.json, keycloak/realm-config/TASK_COMPLETION_SUMMARY.md, frontend/alzheimer-angular2/src/environments/environment.ts
	found: The committed realm configuration documents client alzheimer-angular-client and only defines realm roles ADMIN, DOCTOR, CAREGIVER, PATIENT. The Angular environment uses clientId alzheimer-frontend and the live frontend still contains SOIGNANT and LIVREUR role paths.
	implication: A clean environment built from the committed Keycloak config cannot satisfy the frontend's full role model, and the frontend client ID is out of sync with the documented/imported realm.

- timestamp: 2026-04-21T00:21:00Z
	checked: frontend/alzheimer-angular2/src/app/doctor/*.html, frontend/alzheimer-angular2/src/app/soignant/soignant-layout.component.html, frontend/alzheimer-angular2/src/app/livreur/livreur-layout.component.html, frontend/alzheimer-angular2/src/app/livreur/livreur-dashboard.component.html, frontend/alzheimer-angular2/src/app/patient/patient-dashboard.component.html, frontend/alzheimer-angular2/src/app/shared/placeholder/placeholder.component.html
	found: Doctor pages each embed their own sidebar and topbar markup; livreur dashboard duplicates shell markup instead of using LivreurLayoutComponent; patient dashboard and placeholder pages each render their own shells rather than a shared route layout.
	implication: Sidebar/navbar consistency cannot hold across routes because the live router uses multiple independent shell implementations instead of a single route-level shell per workspace.

- timestamp: 2026-04-21T00:22:00Z
	checked: keycloak/realm-config/alzheimer-realm.json search for user definitions
	found: The committed realm export contains roles and clients but no seeded users or realm-role assignments for test accounts.
	implication: Whether non-doctor accounts exist and have the correct roles is an environment/provisioning concern, not something the frontend code can guarantee from this repository alone.

## Resolution

root_cause: The running frontend is split across two routing/layout systems. Runtime uses AppRoutingModule, where doctor/livreur/patient/admin/caregiver pages are not consistently rendered through shared layout components. Separately, Keycloak/frontend configuration drift leaves the Angular app expecting client and role definitions that are not present in the committed realm export, and unsupported accounts are masked by a dead-end post-login test page.
fix: Align frontend and Keycloak on one role model and one client ID; make unsupported roles fail visibly on the test page; route each workspace through a single shared layout in AppRoutingModule instead of per-page sidebar/topbar duplication; retire or merge the unused standalone shell/router files.
verification: Verified by tracing the active bootstrap path, comparing committed realm roles/client IDs against runtime frontend constants, and comparing live route composition across doctor, livreur, patient, caregiver, admin, and soignant pages.
files_changed: [".planning/debug/frontend-auth-shell-regressions.md"]
