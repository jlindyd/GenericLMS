# Course execution merge — self-paced migration

Only GenericLMS is changed. The original LMSUI, LMSEXECUTION and API repositories remain unchanged. HP LIFE currently uses self-paced courses; coach-assisted execution, review and grading are deferred.

## Implemented

- Existing `/trainee/courses/:courseId/lessons/:lessonId/tasks/:taskId/:taskType` URL shape inside Next.js.
- `/trainee/courses/:courseId` selects the first enabled unfinished task, or the first enabled task when all are finished.
- Execution-specific header, course outline, progress, previous/next navigation, static Content-task rendering and validation.
- Centralized portal/session handling is reused. Locale follows the `lang` query or existing `NEXT_LOCALE` cookie; labels are copied from all eight execution locales.
- Course/lesson/task membership and enabled flags are checked before loading a Content task.
- Content status is authoritative from the API. Auto-validating retrieval refreshes course progress; Finished and WaitingForCoachApproval tasks are not submitted again.
- Completion sends the unchanged `POST api/trainee/content/{id}/validate` with `{}`. The frontend's existing write allowlist adds only that exact learning-service request. Successful completion reloads status, progress and enabled tasks.
- Self-paced static Content, AzureBlobStorage Video and xAPI/SCORM activity routes are implemented inside GenericLMS. Surveys, editable forms and quizzes are now inside GenericLMS (see "Form tasks" below). Vimeo, assignments, tests and meetings temporarily continue at the reference learner site during migration. Content containing frames, scripts, inline event handlers or coach assignment also falls back to the existing player. The target remains one application, not a permanent split.
- Video uses the same Video.js version as the original player. It resumes from API progress, restricts forward seeking when required, supports backward replay and saves a coalesced progress fraction every two seconds, on pause, and on leaving. Failed saves expose a retry action. Pending final progress is sent with fetch keepalive; abrupt browser/process termination can still interrupt delivery.
- Video writes preserve `PUT api/trainee/video/{id}/progress` with a JSON number between 0 and 1. Each write checks course/lesson/task membership and enabled flags using the current learner session. Status, course progress and unlocked tasks are refreshed from the API. Skippable videos retain the original completion-on-opening behavior; completed videos remain replayable without further writes.
- xAPI launches use the same task metadata and learner `sub`/`preferred_username` mapping as the original app. Both xAPI and SCORM packages load through an authenticated same-origin package proxy. The real access token stays server-side; launch parameters point to local xAPI forwarding routes authenticated with the existing cookie. Package-relative files and byte ranges are supported. Storage signatures from the task URL are retained; launch parameters are not forwarded to storage. Only HTTPS package URLs on Azure Blob or DYD hosts are supported initially, with redirects rejected and paths confined to the package directory.
- Forwarding preserves the backend's raw state body, content type, statement responses, status codes and conditional headers: `POST/PUT api/trainee/xApiActivity/{id}/statements`, `GET/PUT/DELETE .../activities/state?stateId=...`, and `GET .../completion`. Each request first validates current learner access, task membership, enabled flags and self-paced scope. Completion waits reconnect and status refreshes cover missed events without reloading the activity frame.
- The native SCORM 1.2 runtime supplies `window.API`, restores location/suspend data/status/score, preserves the old `{content}` state envelope, and emits attempted/resumed/completed/passed/failed/terminated statements. State writes are queued, suspend-data updates are coalesced, failures expose retry, and unload flushes use keepalive. Neither a browser event nor a local SCORM status alone unlocks tasks; course progress is re-read from the API.

## Rollout

`NEXT_PUBLIC_COURSE_EXECUTION=1` at build time switches eligible Start/Continue card links to the new routes. It is OFF by default. Direct execution routes are available for controlled review, but real authenticated reads can advance auto-validated tasks just as in the original app. Do not open real learner tasks as a read-only visual inspection.

Rollback: rebuild without that flag. Existing dashboard links remain on the current site. No schema migration or backend deployment is required.

## Required before enabling

1. Serve GenericLMS on an approved HTTPS test hostname compatible with the existing portal's shared-domain cookies. Local 127.0.0.1 cannot receive `.hplife-test.dyd.solutions` cookies; no authentication workaround is introduced. Set `NEXT_PUBLIC_LEARNER_ORIGIN` to that actual origin at build time. It defaults to the existing reference address; no hostname is provisioned automatically. The origin must be in the selected environment's domain and cannot include a path, query or credentials. Sign-in redirects, header login and course enrollment return to that configured app address. The portal's own return-address policy must allow it. Cookie names, refresh endpoint and shared session remain unchanged.
2. Use a designated test learner/course to validate task retrieval, completion, unlocked navigation, refresh/resume and dashboard progress. No real learner progress writes were performed during implementation.
3. Compare the execution header, sidebar, task body and mobile/Arabic views against HP LIFE Test. The initial frame uses the existing brand and shared fonts, but pixel parity is not yet verified. Keep rollout disabled until approved.
4. Validate HTML resource URLs and completion semantics on actual static Content tasks. Interactive Content remains in the legacy player until its message handling is migrated.

## Subsequent self-paced stages

Vimeo video; editable forms, surveys and quizzes with distinct rules; assignments/tests if enabled; certificates and complete-course feedback; full visual/accessibility regression. Coach-assisted courses are a separate later stage. Video playback and real xAPI/SCORM package loading, state resume, completion and course unlocking still require an authenticated test-course browser run before rollout. Published packages may have absolute asset URLs or transport assumptions that need package-specific verification. SCORM 2004 is not implemented. Browser/process termination can interrupt even keepalive requests.

## Checks

`npm test` covers existing site behavior plus execution links, invalid IDs, course/task relationships, locked tasks, self-paced filtering, interactive fallback, auto-validation progress reads, exact completion/video/xAPI contracts, safe package paths/hosts, raw state forwarding, session guards, SCORM resume, score, failed-save retry and unload persistence. All execution writes are mocked in tests.

Shared-session preparation: the live HP LIFE Test dashboard was accessible using its existing session. A compatible hostname pointing to GenericLMS is still required before that session can reach the local app. No session token was copied across origins and no separate login was added. Do not treat the configurable return URL as completing DNS, HTTPS, hosting, or real learner execution verification.

## Silent renewal and local HTTPS

`requireSession` now renews expiring JWT access cookies through the existing portal refresh endpoint. Execution pages and execution API routes also retry once after an upstream 401, forwarding both rotated cookies to the browser. A 403 is never treated as expiry. Parallel requests share renewal attempts briefly to avoid rotating the same refresh token repeatedly. Activity write retries retain the original raw request body. Failed renewal still requires the normal portal login; these helpers cannot transfer cookies from the HP LIFE domain to localhost.

For this Windows development machine, `scripts/setup-local-https.ps1` prepares `generic-local.hplife-test.dyd.solutions` as a loopback-only hostname. It needs an Administrator PowerShell window because Windows protects the hosts file:

```powershell
& 'C:\DYD\DYDLMS\GenericLMS\scripts\setup-local-https.ps1'
```

The script adds only that hosts entry, creates and trusts a six-month endpoint certificate in the current user's certificate store (not a general-purpose CA), and writes the local canonical origin to ignored `.env.local`. Private certificate files stay in ignored `.local-https`. No remote DNS or deployment changes are made. It intentionally does not enable course rollout.

After setup, rebuild and run GenericLMS on port 3020, and run `npm run local:https` to serve it on HTTPS port 443. Check the existing session with `/api/account` at the new hostname before entering a task. Do not visit a protected page at `127.0.0.1` expecting the remote session to follow. Restarting the browser may be necessary after trusting the certificate. If port 443 is occupied, resolve that conflict before starting the local proxy.

To undo the machine setup, remove the single hosts entry marked `GenericLMS local HTTPS`, remove the certificate named `GenericLMS local HTTPS only` from the current user's Personal and Trusted Root stores, stop the proxy, and remove the origin override from `.env.local`. The original hosts backup is saved for reference; do not overwrite unrelated later hosts edits with that backup.

Current verification: automated renewal and request replay tests pass; local HTTPS activation and real shared-cookie verification remain pending an Administrator setup run.

## Shared-session check (2026-10-26)
With the local HTTPS hostname set up, opening `https://generic-local.hplife-test.dyd.solutions/api/account` in Chrome while signed in to HP LIFE Test returned that account's details (role Admin). So the portal's shared-domain cookies do reach GenericLMS on this hostname and the account call works. Not yet verified with this session: signed-in pages on the real session, task retrieval or completion, and course rollout (still off by default). No course task was opened.

## Form tasks: surveys, editable forms and quizzes (2026-10-26)

Self-paced surveys, editable forms and quizzes assigned to the learner now run inside GenericLMS at the existing task URL (`.../tasks/:taskId/survey|editableform|quiz`). Anything else still continues in the existing player: coach-assigned tasks, coach-assisted courses and forms with a question type this player does not know. Still in the old player: Vimeo video, assignments, tests, meetings and interactive Content.

- **Reads and writes:** `GET api/trainee/form/{id}` and one allowed write, `POST api/trainee/form/{id}` with `{ op: 'save' | 'submit', answers }` (nothing else changed on the learning service). The task's status, score, progress and unlocked tasks are read back after every write; the browser never decides whether a task is finished or passed.
- **Answers:** same shapes as the old player (single answer ids, id lists, grids keyed by sub-question id, `YYYY-MM-DD`, `YYYY-MM-DDTHH:mm`, a time as an ISO moment on today's date in UTC). `/api/execution/form` checks every answer against the form's own questions (known ids, option ids, scale range, date shapes, text length) and, on submit, required questions and minimum/maximum ticked options, then sends the cleaned body.
- **Question types:** single/multi-line text, drop-down, radio, checkbox (with min/max), radio and checkbox grids, linear scale, date, date-time, time, description. All questions on one page, or one at a time with a "go to question" menu when the form says so.
- **Behaviour kept from the old player:** surveys close when finished; editable forms can be saved, resumed, submitted and edited again; a quiz shows its grade and the grade to pass, marks correct and wrong answers once answered, can be retried when failed and closes when passed; a failed submission keeps the answers given so far (a save) and marks the unanswered required questions.
- **Correct answers:** the quiz's expected answers are sent to the browser only once the quiz has been answered, so they cannot be read from the page of a quiz still open. Authored HTML is cleaned before it reaches the page; coach feedback is not sent.
- **Labels:** the eight languages come from the old player (`platform/form-translations.json`); a label missing in a language falls back to English, as the old player does.
- **Review mode:** `platform/fixture-forms.js` adds a self-paced fixture course (`/trainee/courses/1/lessons/11/tasks/31|32|33/...`) with a survey, a quiz and an editable form; answers live in the server's memory and nothing is sent anywhere.
- **Not done / not verified:** a real run on HP LIFE Test with a designated learner (no real answers were sent in any check); the old player's keyboard-driven question navigation bar (a simpler "go to question" menu is used); coach responses and feedback; pixel comparison with the old player; Arabic layout review.
