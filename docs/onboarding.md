# OPENsport first-use guide

## Product goal

Help a newly registered person take one useful action: submit a kick for analysis, or establish a team workspace. The guide explains the path from an action to its value without requiring a video, populated scores or team members to exist already.

The current registration flow has no player/coach permission selector. The welcome choice selects an introduction; it does not assign an account role or grant team permissions.

## Scope and copy

A welcome overlay introduces two paths, followed by three steps that advance at the user's pace. The guide remains short enough to read before doing the work.

The short, optional flow, instructions beside relevant controls and replay from the account menu follow [Apple's onboarding guidance](https://developer.apple.com/design/human-interface-guidelines/onboarding?changes=_7). Apple also recommends postponing nonessential setup. The two paths and three-step limit are OPENsport product decisions based on the first-use goals above; they are not a prescribed industry benchmark.

| Path | Step | What the guide explains | First real action |
| --- | --- | --- | --- |
| Player | Film and upload | One kick filmed from the side at 90°, full body and ball visible; MP4/MOV/AVI/MKV up to 50 MB | Upload a video |
| Player | Read the analysis | Stability, power, technique and balance appear after processing; view video alongside the breakdown | Review the result once ready |
| Player | Train and repeat | Choose drills, film again from the same angle, compare analysis history | Pick a training focus |
| Coach | Select or create a team | A team establishes the workspace for the squad | Create a team when none exists |
| Coach | Invite players | Share an invitation link or join code after team creation | Invite players when a team exists |
| Coach | Use the workspace | Squad, Statistics and Training tabs help follow players and plan sessions | Open the squad |

An active join code permits joining directly. The guide does not introduce an approval step that the application does not require. Empty teams receive copy that explains where information will appear after players join. New player accounts receive no invented scores or sample analysis presented as their own result. This follows [Nielsen Norman Group's empty-state guidance](https://www.nngroup.com/articles/empty-state-interface-design/) to distinguish unavailable data from loading/errors and offer a useful next action.

Profile details, physical statistics, team membership for players, rankings and duels are available elsewhere. They do not interrupt the first analysis or team setup. The tutorial does not make profile completion a prerequisite for uploading.

English, Russian and Kazakh copy lives in the `onboarding` namespace. Descriptions use one or two short sentences; each step has one short tip. The welcome process illustration uses labels only, with no fictitious performance numbers.

## Visual and interaction direction

Use the existing paper, ink and pitch palette, typography and button language. Decorative SVG/CSS motion explains the process on the welcome screen; actual page regions receive a spotlight during the steps. Show one instruction and one primary action at a time.

The tour is skippable, closes with Escape and supports keyboard use. Focus belongs to the active overlay, the background is unavailable while the guide is open, and focus returns to a useful page control on close. These behaviors follow the [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

Mobile layouts keep controls inside the viewport and allow text to scroll without hiding the navigation controls. Animations respect `prefers-reduced-motion`; understanding a step must never depend on motion, consistent with [W3C guidance on animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). Prefer a short, finite welcome animation rather than motion that continues while the user reads.

During workspace loading, the explanation remains visible and Back, Skip and Close remain available. Empty state copy is part of the guide rather than an assumption that the user already has results. Final actions enter the existing upload, creation or invitation flows instead of duplicating those features in the tutorial.

In demo mode, the coach's final action opens the squad; it does not present a live team creation or invitation as a demo capability.

## Account lifecycle

1. Successful signup OTP verification writes a version 1 `pending` state. Verification errors do not start the guide.
2. Automatic entry requires a confirmed, signed-in account with a pending state. Ordinary existing accounts and demo sessions do not receive an automatic first-use overlay.
3. The selected path can carry the guide to the player or coach dashboard. This preference is separate from access permissions.
4. Finishing saves `completed`; skipping or closing saves `skipped`. Completion is saved before the final action opens its destination.
5. The account menu provides manual replay on signed-in and demo pages. Replay opens the guide on the relevant dashboard and does not reset a completed account to pending.

`src/lib/onboarding.ts` stores state under the Supabase user metadata key `opensport_onboarding` and the local key `opensport:onboarding:v1:<userId>`. State includes `version`, `status`, `updatedAt` and an optional `role` preference.

Local persistence happens immediately. Remote writes are serialized per account and check the current session's user ID before updating metadata. The metadata write sends only the onboarding key, preserving other profile fields. A completed state wins over stale pending/skipped data, and timestamps choose between states of equal status.

Blocked or corrupt local storage does not stop sign-in: an in-memory state supports the current tab, and remote persistence is attempted. A failed remote write retains the local result. Cross-device continuity depends on successful metadata synchronization; it is not guaranteed by local storage alone.

## Verification boundaries

The guide can be reviewed manually in demo mode without creating a production account. Browser checks can establish step navigation, responsive positioning, role-specific targets, keyboard/Escape behavior, reduced motion and final-action routing. Helper tests can establish per-account state handling and stale-state precedence.

A local review is not proof of production signup email delivery, OTP verification, Supabase metadata synchronization, real video processing or team creation. Those require the corresponding live services and an authorized test account.

Implemented verification:

- 18 focused persistence checks: account isolation, confirmed-account eligibility, stale-state precedence, unavailable storage, offline sync and serialized writes.
- 23 browser checks with intercepted Supabase responses: registration form, failed/successful OTP, dashboard readiness, dismissal, login/reload, separate accounts, empty coach workspace and existing action dialogs.
- 62 browser checks on the final layout: desktop, 320/390 px phones and landscape; visible navigation controls, spotlight placement, step navigation, keyboard focus, Escape and reduced motion. Coach layouts were also inspected at 768 and 1440 px.
- Vite production build, targeted ESLint and whitespace checks pass. Full-project TypeScript still reports the 89 pre-existing errors; the new onboarding files do not add errors in that check.
