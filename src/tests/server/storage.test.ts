import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { LocalStorage } from "@/server/storage";

let tmpDir: string;
let storage: LocalStorage;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "photobook-storage-"));
  storage = new LocalStorage(tmpDir);
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("LocalStorage", () => {
  describe("upload", () => {
    it("writes data to the correct path", async () => {
      const data = Buffer.from("hello world");
      await storage.upload("photos/test.txt", data, "text/plain");

      const written = await fs.readFile(path.join(tmpDir, "photos/test.txt"));
      expect(written).toEqual(data);
    });

    it("creates intermediate directories as needed", async () => {
      await storage.upload("a/b/c/file.jpg", Buffer.from("x"), "image/jpeg");

      const stat = await fs.stat(path.join(tmpDir, "a/b/c/file.jpg"));
      expect(stat.isFile()).toBe(true);
    });

    it("overwrites an existing file", async () => {
      await storage.upload("file.txt", Buffer.from("v1"), "text/plain");
      await storage.upload("file.txt", Buffer.from("v2"), "text/plain");

      const content = await fs.readFile(path.join(tmpDir, "file.txt"), "utf8");
      expect(content).toBe("v2");
    });
  });

  describe("getUrl", () => {
    it("returns the /api/files/ route for any key", () => {
      expect(storage.getUrl("photos/abc.jpg")).toBe("/api/files/photos/abc.jpg");
    });

    it("preserves nested path structure in the URL", () => {
      expect(storage.getUrl("projects/p1/photos/img.png")).toBe(
        "/api/files/projects/p1/photos/img.png"
      );
    });
  });

  describe("delete", () => {
    it("removes the file from disk", async () => {
      await storage.upload("to-delete.txt", Buffer.from("bye"), "text/plain");
      await storage.delete("to-delete.txt");

      await expect(
        fs.access(path.join(tmpDir, "to-delete.txt"))
      ).rejects.toThrow();
    });

    it("does not throw when the file does not exist", async () => {
      await expect(storage.delete("nonexistent.txt")).resolves.not.toThrow();
    });
  });
});
