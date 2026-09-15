# QA — how "tested end-to-end" is verified

Pilot-weight testing: a manual checklist per section (below) + a small Playwright smoke suite for the one flow that must never break.

## Automated (Playwright, run on every deploy)
1. Demo Club A dashboard loads, token balance renders
2. Open an entry → Action Pop-up opens → keyboard: Tab cycles inside, Esc closes
3. Pink action submits → confirmation shows cost + new balance → `Actions_Log` has exactly one new row → submitting the same idempotency key again adds zero rows
4. Demo Club B dashboard loads with empty states, zero console errors, no "undefined" rendered anywhere
5. A URL with an invalid clubToken gets a designed 404, not another club's data

## Manual per-section pass (before Definition of Done sign-off)
- [ ] Every button/link pressed once on desktop, once on a real phone
- [ ] Empty state reviewed against Demo Club B
- [ ] Contrast spot-check on any new colour use (WCAG AA)
- [ ] Screen reader pass (VoiceOver): landmarks, labels, modal announcement
- [ ] Kill the network mid-action → error state matches architecture.md § Failure, no double deduction after retry
- [ ] Kennedy received the notification for each pink action type in the section
