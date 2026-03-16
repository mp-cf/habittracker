import { promises as fs } from 'fs';
import path from 'path';

const authFile = path.join(process.cwd(), 'data', 'auth.json');

export async function getStoredPassword() {
  if (process.env.APP_PASSWORD) {
    return process.env.APP_PASSWORD;
  }

  const raw = await fs.readFile(authFile, 'utf8');
  const data = JSON.parse(raw);
  return data.password as string;
}

export async function verifyPassword(candidate: string) {
  const password = await getStoredPassword();
  return candidate === password;
}
