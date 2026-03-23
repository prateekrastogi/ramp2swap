declare global {
  interface CloudflareBindings {
    AUTH_DB: D1Database;
    SESSION_SECRET: string;
    RESEND_KEY?: string;
    LOGIN_EMAIL_FROM?: string;
    AUTH_EMAIL_MODE?: string;
  }
}

export {};
