import { ulid } from 'ulid';
export function newId(prefix?: string){
  const id = ulid();
  return prefix ? `${prefix}_${id}` : id;
}
export function randomToken(length = 32){
  const chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s=''; crypto.getRandomValues(new Uint8Array(length)).forEach(v=> s+=chars[v%chars.length]);
  return s;
}
