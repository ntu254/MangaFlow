# Mobile Scheduler and Native Clipboard Design

## Goal

Fulfil the approved mobile scheduling and safe-support-diagnostics interactions on both Expo native and web targets.

## Decisions

- Hour and minute inputs are independent vertical wheel pickers. Each wheel has a fixed three-row viewport, `snapToInterval` equal to row height, a visible centered selected value, and changes its selected value from the settled scroll offset. Values remain 00–23 and 00–59; calendar day selection and future-local-minute validation are unchanged.
- A pressable row remains available for accessibility and testability, but the control is a wheel, not a horizontal grid of buttons.
- Add Expo's supported native clipboard module. `copyToClipboard` uses it on native, retains `navigator.clipboard` on web, and always exposes the Support details Copy action when native clipboard is available. Copy failures remain safe and retryable.
- Update the mobile agent guide to reflect the approved Priority tab and actor-scoped `/editor/activity` history endpoint.

## Verification

- Screen tests prove each wheel exposes snap configuration, selected state, and scroll-to-select behavior for hour/minute.
- Clipboard tests mock the native module and web API independently, including native copy failure.
- Mobile lint, test, UTF-8 guard, Expo web build, and diff check pass.
