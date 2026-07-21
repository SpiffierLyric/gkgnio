interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface D1Result<T = Record<string, unknown>> {
  success: boolean;
  results: T[];
  meta?: Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface R2HTTPMetadata { contentType?: string }
interface R2ObjectBody {
  body: ReadableStream;
  httpMetadata?: R2HTTPMetadata;
}
interface R2PutOptions { httpMetadata?: R2HTTPMetadata }
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: ArrayBuffer | ReadableStream | string, options?: R2PutOptions): Promise<unknown>;
}

interface DurableObjectId { readonly __durableObjectId: unique symbol }
type DurableObjectStub = Fetcher;
interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  deleteAll(): Promise<void>;
  setAlarm(scheduledTime: number | Date): Promise<void>;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
  acceptWebSocket(socket: WebSocket, tags?: string[]): void;
  getWebSockets(tag?: string): WebSocket[];
}

interface WebSocket {
  serializeAttachment(attachment: unknown): void;
  deserializeAttachment(): unknown;
}

declare class WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}
