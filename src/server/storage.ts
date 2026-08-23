import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/config/env";

export interface StorageProvider {
  upload(key: string, data: Buffer, mimeType: string): Promise<void>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
}

export class LocalStorage implements StorageProvider {
  constructor(private readonly baseDir: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(key: string, data: Buffer, _mimeType: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  }

  getUrl(key: string): string {
    return `/api/files/${key}`;
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(path.join(this.baseDir, key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }
}

export const storage: StorageProvider = new LocalStorage(
  env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads")
);
