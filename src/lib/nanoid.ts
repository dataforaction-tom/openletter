import { nanoid } from 'nanoid';

export function generateId(size: number = 21): string {
  return nanoid(size);
}

export function generateToken(): string {
  return nanoid(32);
}
