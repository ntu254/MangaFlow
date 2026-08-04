# Mobile Editor and File Demo Design

## Goal

Fix repeat checklist saves, make images and PDFs reviewable in Android Expo Go emulator demos, and stop Editor review actions from obscuring review content.

## Scope

- Mobile checklist requests send only the six editable boolean fields.
- Android Expo Go previews PDFs in-app with a bundled PDF.js viewer hosted in `WebView`.
- Image preview keeps its signed display URL flow and reports emulator connectivity failures clearly.
- Editor proposal actions become normal scroll content rather than a persistent screen-consuming bar.

## Checklist contract

The backend remains the owner of checklist metadata such as `completedById`. The mobile client must construct the update payload from exactly `hook`, `characterMotivation`, `audienceFit`, `storyboardFlow`, `manuscriptQuality`, and `serializePotential`. It must never echo read-only metadata returned by the API. A regression test saves an incomplete checklist, refetches metadata, changes another item, and verifies the second payload contains only those six keys.

## Expo Go file preview

`/files/display-url` remains the source of a short-lived server URL. Mobile preserves the existing 30-second early renewal and a single reload after a preview failure. `resolveDisplayUrl` must continue to map backend `localhost` URLs to Android emulator `10.0.2.2`.

Images use the native `expo-image` renderer. When the API or token URL cannot be reached from the emulator, the viewer shows a retryable connection error instead of a blank preview.

For Android PDF, `derivePreviewKind` returns `pdf` and `ReviewFileViewer` loads a bundled PDF.js HTML viewer inside `react-native-webview`. The viewer receives the signed URL only in memory, fetches it directly, and displays loading/error states. It does not persist or log the URL. iOS continues its WebView PDF preview. Unsupported file types retain the external handoff.

## Editor review layout

`WorkflowDetailLayout` renders Editor proposal actions in its scrolling content after the review material, not as a fixed or sticky region. A user can read and inspect submitted images/files without an action bar covering the viewport. Action availability, disabled reasons, and confirmation behavior remain unchanged.

## Tests

- Mobile proposal flow: repeat incomplete checklist save serializes only editable fields.
- Mobile file review: Android PDFs choose in-app PDF preview, emulator URL mapping remains correct, and image/PDF error paths expose retry.
- Mobile Editor proposal screen: long review content remains scrollable and the action bar is not fixed over it.
- Run focused suites, then lint, complete mobile test suite, and Expo web build.

## Out of scope

- Backend permission, token TTL, storage, and audit behavior.
- A native PDF dependency or development build.
- Web and non-mobile UI changes.
