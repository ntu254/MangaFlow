// React Native Testing Library registers its Jest matchers automatically.

// Deterministic API base URL for tests that exercise the typed client.
process.env.EXPO_PUBLIC_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3001/api"

// react-native-webview registers a native module that does not exist in the
// Jest/RN test renderer environment. It is only used for PDF preview inside
// review-file-viewer.tsx; a plain View stand-in is enough for tests that
// merely mount screens which import it transitively.
jest.mock("react-native-webview", () => {
  const { View } = require("react-native")
  return { WebView: View }
})
