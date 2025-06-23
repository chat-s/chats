/// <reference types="vite/client" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      GEMINI_API_KEY: string;
      GEMINI_BASE_URL?: string;
    }
  }
}

export {}; 