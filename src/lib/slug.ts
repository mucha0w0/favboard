import { customAlphabet } from "nanoid";

const generateSlug = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  10,
);

export function createSlug(): string {
  return generateSlug();
}
