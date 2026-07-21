export interface AppEnv {
  ASSETS: Fetcher;
  DB?: D1Database;
  MEDIA?: R2Bucket;
  ROOMS: DurableObjectNamespace;
  IMAGES?: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  APP_SESSION_SECRET?: string;
  ADMIN_EMAILS?: string;
}
