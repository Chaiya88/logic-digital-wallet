export interface BaseBindings {
  KV_APP: KVNamespace;
  DB_MAIN: D1Database;
}
export interface BankingEnv extends BaseBindings {}
export interface SecurityEnv extends BaseBindings {}
export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
