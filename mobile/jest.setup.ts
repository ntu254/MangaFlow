// React Native Testing Library registers its Jest matchers automatically.

// Deterministic API base URL for tests that exercise the typed client.
process.env.EXPO_PUBLIC_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3001/api"
