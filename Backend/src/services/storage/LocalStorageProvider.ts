import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { IStorageProvider, SavedFileInfo } from './StorageProvider';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    // Default to server/storage/documents
    this.baseDir = baseDir || path.resolve(process.cwd(), 'storage', 'documents');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getSafeFilePath(storageKey: string): string {
    const sanitizedKey = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.resolve(this.baseDir, sanitizedKey);
    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Path traversal attempt detected');
    }
    return fullPath;
  }

  async saveFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    subfolder: string = ''
  ): Promise<SavedFileInfo> {
    const targetDir = subfolder ? path.join(this.baseDir, subfolder) : this.baseDir;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(originalName).toLowerCase();
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const sanitizedBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFileName = `${Date.now()}_${randomSuffix}_${sanitizedBase}${ext}`;
    const storageKey = subfolder ? path.join(subfolder, uniqueFileName).replace(/\\/g, '/') : uniqueFileName;
    const fullPath = path.join(targetDir, uniqueFileName);

    await fs.promises.writeFile(fullPath, buffer);

    // Protected download API endpoint is the canonical fileUrl
    const fileUrl = `/api/documents/file/${encodeURIComponent(storageKey)}`;

    return {
      fileName: originalName,
      fileUrl,
      storageKey,
      fileSize: buffer.length,
      mimeType
    };
  }

  async getFileStream(storageKey: string): Promise<{
    stream: Readable;
    mimeType?: string;
    fileSize?: number;
  }> {
    const fullPath = this.getSafeFilePath(storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found in local storage');
    }

    const stat = await fs.promises.stat(fullPath);
    const stream = fs.createReadStream(fullPath);

    return {
      stream,
      fileSize: stat.size
    };
  }

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    const fullPath = this.getSafeFilePath(storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found in local storage');
    }
    return await fs.promises.readFile(fullPath);
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      const fullPath = this.getSafeFilePath(storageKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err) {
      console.warn(`[LocalStorageProvider] Failed to delete file ${storageKey}:`, err);
    }
  }
}
