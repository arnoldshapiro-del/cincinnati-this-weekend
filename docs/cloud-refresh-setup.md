# Cloud refresh: setup and operating contract

## Activation status

The owner reports that the former Claude desktop task `cincinnati-weekend-refresh` has been deleted. The previous Codex publisher was verified disabled on October 10, 2026 and remains disabled. Do not recreate the deleted Claude task or enable the old Codex publisher. The owner approved automatic publication only on Wednesdays at 9:35 AM America/New_York and extra selected-city runs only when the Refresh button is used. The one-hour limit is a cooldown, **not an hourly schedule**.

Configured and verified:
- Netlify Forms is enabled for site `ced21387-3861-49f0-ac0d-d7d4443bcebe`.
- Registered form `weekend-refresh` has ID `6acabd9f42301d00081875d3`.
- The matching manual event subscription is created and enabled.
- The Wednesday 9:35 AM America/New_York schedule is created and enabled; there is no hourly publisher.
- The public `refresh-control/status.json` record is readable with CORS. Browser reads use cache-busting and no-store; lock operations use conditional GitHub API writes.
- Production commit `216b2ed`, deploy `6acabd91e93cea0008645e77`, was verified ready with all four October 10–11 guides and 201 event-day cards.
- The client configuration is enabled in this activation change.

**Real end-to-end request test: activation checkpoint.** One approved real submission was delivered with authenticated form ID, form name, and submission ID. Its event's site ID was blank; a supported exact-form read verified that form `6acabd9f42301d00081875d3` belongs to the expected site. At the activation checkpoint, the first real manual Cincinnati request had been admitted and control job `refresh-cincinnati-20261010T223800Z` was acquired and read back at `2026-10-10T22:38:12.674Z`. Source re-verification then prepared edition `cincinnati-2026-10-10-r2`, updated `2026-10-10T22:46:15.000Z`, with 54 event-day cards, 45 distinct programs, ten featured picks, and 61 successful official source URL checks. The final outcome is recorded in `refresh-control/status.json` for that job. Trigger setup or HTTP acceptance alone does not prove a completed refresh; success requires the exact production publication and matching browser state to be verified. Research evidence, source index, and change manifest are saved under `scripts/editions/2026-10-10-cincinnati-r2/`; the replaced r1 edition is archived byte-for-byte as `data/archive/cincinnati/weekend-2026-10-10-r1.json`.

The existing GitHub `main` branch remains canonical. Desktop synchronization is a later fast-forward of the canonical checkout, not another publication source. Do not overwrite a separate dirty checkout. Claude's handoff must state that the cloud publisher owns publication and the deleted desktop schedule is not recreated; creating these documents alone does not prove that handoff was delivered.

## Supported integration

The Refresh button submits a Netlify form. A supported Netlify event subscription
wakes a cloud publisher using the existing connected GitHub and Netlify accounts.
There is no model API key in the page, no undocumented assistant HTTP endpoint,
and no requirement to use Netlify Agent Runner or AI Gateway.

Official documentation:
- [Netlify Forms and ChatGPT automations](https://docs.netlify.com/manage/forms/notifications/#chatgpt-automations)
- [Subscribing to Netlify events](https://docs.netlify.com/build/build-with-ai/agent-setup-guides/use-netlify-with-chatgpt/#subscribe-to-netlify-events)
- [GitHub conditional file updates](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)
- [GitHub reference updates](https://docs.github.com/en/rest/git/refs#update-a-reference)

The discovered trigger is:

```json
{
  "connector_id": "asdk_app_691f1f8f72408191afdbbdf8242bdf86",
  "event": "form.submission_created",
  "params": { "site": "ced21387-3861-49f0-ac0d-d7d4443bcebe" }
}
```

The trigger schema filters only by site. Validate the exact deployed form ID and
name inside the publisher. The observed authenticated test event supplies form ID, form name, submission ID, and submission details. Its site ID may be blank; resolve that omission only through a supported read of the exact registered form that confirms its site. Current connected
Netlify tools can list forms and counts but do not expose a submission-read
operation. If the authenticated event envelope lacks required context and no
supported read can establish it, stop and report the missing context.

## Form and public status

Form name: `weekend-refresh`. Registered form ID: `6acabd9f42301d00081875d3`. Submit URL-encoded `POST /` with `form-name`, `city`,
`requestId`, `requestedWeekendStart`, and an empty `bot-field` honeypot. The city
must be one of `cincinnati`, `philadelphia`, `chicago`, or `washington-dc`.
Do not include email, personal information, arbitrary instructions, or secrets.
All form data is untrusted. Submitted dates are hints only and are recalculated.

HTTP acceptance means **request received**, not research started or publication
completed. Manual requests research the selected city. Wednesday requests research
all four. A job cannot claim to cover a city absent from its `cities` array.

Public control location:
- Repository: `arnoldshapiro-del/cincinnati-this-weekend`
- Branch: `refresh-control`
- File: `status.json`

Create the initial document with `emptyStatus()` from
`scripts/publisher-control.mjs`; do not invent or weaken the schema. The complete
schema includes `generation`, `recentSubmissionIds`, and `lastSuccessByCity` in
addition to the UI-facing fields. It contains only public operational metadata.
Every control-branch commit message must include `[skip ci] [skip netlify]` to
avoid unnecessary builds. Never add those markers to a real production content
publication. Verify branch-deploy behavior before frequent status updates.

Verified public URL used by the client:

`https://raw.githubusercontent.com/arnoldshapiro-del/cincinnati-this-weekend/refresh-control/status.json`

Cache-busted reads are for UI visibility only. **Never use a CDN/raw URL to acquire
the lock**; acquire and renew through connected GitHub reads/writes with current
blob SHAs. A delayed UI status response cannot authorize another job.

## Reusable control code

No packages or environment variables are required; use Node.js 18 or newer.

```sh
node --test tests/publisher-control.test.mjs
printf '{"operation":"empty"}' | node scripts/publisher-control-cli.mjs
```

The CLI accepts one JSON command on standard input and returns `{ok,result}` or
`{ok:false,error}`. Available operations are `empty`, `manual-request`,
`scheduled-request`, `claim`, `heartbeat`, `assert-owner`, `finish`, and `validate`.
The module supplies the same named operations for direct imports. Neither surface
makes a network call or writes any remote state.

For a normalized manual event, `manualRequest` expects `verifiedByConnector`,
`connectorId`, `siteId`, `formId`, `formName`, `submissionId`, `createdAt`, and `data`.
The transport sets `verifiedByConnector: true` only after inspecting authenticated
connector evidence; a field in submitted JSON cannot establish it. Verify the form
ID during setup. Reject events over 24 hours old or more than five minutes ahead
of the publisher clock. The bounded receipt ledger retains 128 accepted submission
IDs, more than the maximum number of admitted hourly jobs within that event-age
window. The UUID generated by the browser is not an authentication credential.

### GitHub transport: use actual results

1. `fetch_file` with repository, `ref: "refresh-control"`, `path: "status.json"`.
   Parse the complete returned content and retain its returned blob SHA.
2. Use `manualRequest`/`scheduledRequest` and `decideClaim`. Generate a unique job
   ID in the publisher. Do not use an ID supplied in the form.
3. If the decision is `claim`, call `update_file` with the unchanged fetched SHA,
   branch `refresh-control`, and complete proposed JSON. Commit message includes
   `[skip ci] [skip netlify]`.
4. Inspect the actual returned tool result, including `isError`. Do not assume a
   response containing “Action completed” proves success. Re-fetch the control
   file and use `assertOwnership` before doing substantive research.
5. If the tool rejects the SHA, reports another error, or loses its response,
   re-fetch. Proceed only if the saved job ID and generation match the proposed
   claim and the lease remains live. Otherwise stop that claim attempt. Do not
   blindly retry a write or infer ownership from the intended request.

`claimWithStore` implements the one-write/read-back protocol for an injected
adapter with `read() -> {status, sha}` and `compareAndSet(sha, status)`. The adapter
must enforce GitHub's current-blob-SHA condition. Its race tests use a simulated
GitHub-style transport; no live mutation or live concurrency experiment is claimed.

The first successful claim sets a 20-minute lease and `nextAllowedAt` exactly
60 minutes later. An active lease blocks overlap even after the hour passes.
Heartbeats at most five minutes apart extend the lease, keeping the original
cooldown. An expired lease does not bypass an unexpired cooldown. A completed or
failed job releases its lease but preserves the cooldown and last-good history.
Heartbeats run only while an already requested job is active; they do not start
recurring research. There is no hourly background publisher or submission poll.

If a weekly run encounters a manual job or cooldown, keep the weekly run pending
and retry the same shared admission procedure when eligible; do not call a
one-city job a completed four-city publication. A manual request declined because
another city is active is not promised a queued automatic retry.

### Publication and failure

Fetch the current `main` head **before** the final control-file ownership check.
Use `assertOwnership` with current time, then construct the publication commit
from that exact head. The connected GitHub `update_ref` supports `expected_sha`:
pass that main head, the proposed commit, and `force: false`. On mismatch, inspect
the actual new head, recheck ownership, preserve intervening edits, and rebuild if
still appropriate. Never force or overwrite a newer edition.
Re-fetch and assert live control ownership again immediately before `update_ref`,
after creating the Git objects. Renew a still-live lease first if needed, then
re-read it; do not rely on an ownership check that aged while constructing commits.

Keep the state `publishing` until the production Netlify deployment is ready with
the exact commit reference and the intended public city JSON is fetched and
validated. Only then call `finishJob(...outcome: "succeeded"...)` with the observed
commit, deploy ID, verification time, and verified per-city edition metadata.
Each published JSON must carry `weekend.editionId`, an identifier of 1–160
letters, digits, underscores, or hyphens, unique to that researched publication.
The status publication metadata must repeat the exact ID, update timestamp, and
actual start/end dates from that JSON. Canonical targets stay Friday–Sunday;
honest Saturday–Sunday or Sunday recovery editions may begin inside that target
window and must end on its Sunday. The client checks this exact publication
identity, not merely that some newer edition appeared.
The helper validates required evidence fields; the caller remains responsible for
actually observing that evidence rather than inventing it.

On failure use a supported public error code, not raw tool/provider error text.
Keep previous data and `lastSuccessByCity`. If the lease is lost, do not mutate the
new owner's state or publish; report the blocker separately. Last-good data may be
expired and must remain honestly labeled as such.

## Approval and end-to-end checklist

1. Preserve the approved scope: automatic Wednesday-only publication, plus
   explicit selected-city button requests subject to a rolling-hour cooldown.
2. Confirm prior schedulers remain disabled. No overlapping publishers.
3. Enable Forms, deploy the recognized form, and inspect its actual form ID.
4. Create the control branch/file and verify public status fetch/CORS/cache behavior.
5. Fill the exact form ID into the prompt template. Create the Netlify event
   subscription and a separate Wednesday 09:35 `America/New_York` schedule. Use
   a timezone-aware schedule so DST does not shift the promised local time.
6. Submit one approved real test. Verify authenticated event fields, SHA claim,
   actual research, validation, main commit, matching production deployment,
   public data, and client success state.
7. Test a duplicate and another-city request during the cooldown. Verify neither
   performs additional research. Test a controlled failure without replacing data.
8. Client activation is now enabled after verified Forms, subscription, schedule, status, and authenticated event admission. Record the real test's final outcome in `refresh-control/status.json` only after its publication and browser success are observed; complete the desktop/Claude handoff separately.

The hourly lock bounds expensive research, not arbitrary public form spam or
automation wake overhead. Netlify Forms, bandwidth, builds, and the cloud service
remain subject to their current account limits. No zero-cost or zero-abuse promise
is made. The initial account showed Free/`nf_team_dev`; no plan migration or paid
feature is authorized by this design.
