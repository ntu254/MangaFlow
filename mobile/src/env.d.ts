declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_DEV_AUTH_TOKEN?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

