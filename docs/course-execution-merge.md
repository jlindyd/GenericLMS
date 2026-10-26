# Course execution merge — first self-paced slice

Only GenericLMS is changed. The original LMSUI, LMSEXECUTION and API repositories remain unchanged. HP LIFE currently uses self-paced courses; coach-assisted execution, review and grading are deferred.

## Implemented

- Existing `/trainee/courses/:courseId/lessons/:lessonId/tasks/:taskId/:taskType` URL shape inside Next.js.
- `/trainee/courses/:courseId` selects the first enabled unfinished task, or the first enabled task when all are finished.
- Execution-specific header, course outline, progress, previous/next navigation, static Content-task rendering and validation.
- Centralized portal/session handling is reused. Locale follows the `lang` query or existing `NEXT_LOCALE` cookie; labels are copied from all eight execution locales.
- Course/lesson/task membership and enabled flags are checked before loading a Content task.
- Content status is authoritative from the API. Auto-validating retrieval refreshes course progress; Finished and WaitingForCoachApproval tasks are not submitted again.
- Completion sends the unchanged `POST api/trainee/content/{id}/validate` with `{}`. The frontend's existing write allowlist adds only that exact learning-service request. Successful completion reloads status, progress and enabled tasks.
- Self-paced static Content and AzureBlobStorage Video tasks now run inside GenericLMS. Vimeo, forms, quiz, survey, assignment, tests, meetings and xAPI/SCORM temporarily continue at the reference learner site during migration. Content containing frames, scripts, inline event handlers or coach assignment also falls back to the existing player. The target remains one application, not a permanent split.
- Video uses the same Video.js version as the original player. It resumes from API progress, restricts forward seeking when required, supports backward replay and saves a coalesced progress fraction every two seconds, on pause, and on leaving. Failed saves expose a retry action. Pending final progress is sent with fetch keepalive; abrupt browser/process termination can still interrupt delivery.
- Video writes preserve `PUT api/trainee/video/{id}/progress` with a JSON number between 0 and 1. Each write checks course/lesson/task membership and enabled flags using the current learner session. Status, course progress and unlocked tasks are refreshed from the API. Skippable videos retain the original completion-on-opening behavior; completed videos remain replayable without further writes.

## Rollout

`NEXT_PUBLIC_COURSE_EXECUTION=1` at build time switches eligible Start/Continue card links to the new routes. It is OFF by default. Direct execution routes are available for controlled review, but real authenticated reads can advance auto-validated tasks just as in the original app. Do not open real learner tasks as a read-only visual inspection.

Rollback: rebuild without that flag. Existing dashboard links remain on the current site. No schema migration or backend deployment is required.

## Required before enabling

1. Serve GenericLMS on an approved HTTPS test hostname compatible with the existing portal's shared-domain cookies. Local 127.0.0.1 cannot receive `.hplife-test.dyd.solutions` cookies; no authentication workaround is introduced. Set `NEXT_PUBLIC_LEARNER_ORIGIN` to that actual origin at build time. It defaults to the existing reference address; no hostname is provisioned automatically. The origin must be in the selected environment's domain and cannot include a path, query or credentials. Sign-in redirects, header login and course enrollment return to that configured app address. The portal's own return-address policy must allow it. Cookie names, refresh endpoint and shared session remain unchanged.
2. Use a designated test learner/course to validate task retrieval, completion, unlocked navigation, refresh/resume and dashboard progress. No real learner progress writes were performed during implementation.
3. Compare the execution header, sidebar, task body and mobile/Arabic views against HP LIFE Test. The initial frame uses the existing brand and shared fonts, but pixel parity is not yet verified. Keep rollout disabled until approved.
4. Validate HTML resource URLs and completion semantics on actual static Content tasks. Interactive Content remains in the legacy player until its message handling is migrated.

## Subsequent self-paced stages

Vimeo video; editable forms, surveys and quizzes with distinct rules; assignments/tests if enabled; xAPI/SCORM state, statements, completion streams and existing same-origin asset proxy; certificates and complete-course feedback; full visual/accessibility regression. Coach-assisted courses are a separate later stage. Video playback, seek prevention, saved resume and completion still require a real authenticated test-course browser run before rollout.

## Checks

`npm test` covers existing site behavior plus execution links, invalid IDs, course/task relationships, locked tasks, self-paced filtering, interactive fallback, auto-validation progress reads, the exact completion endpoint/body and same-origin/session route guards. All execution writes are mocked in tests.

Shared-session preparation: the live HP LIFE Test dashboard was accessible using its existing session. A compatible hostname pointing to GenericLMS is still required before that session can reach the local app. No session token was copied across origins and no separate login was added. Do not treat the configurable return URL as completing DNS, HTTPS, hosting, or real learner execution verification.
