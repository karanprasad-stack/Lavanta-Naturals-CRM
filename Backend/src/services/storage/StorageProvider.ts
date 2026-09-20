import { Readable } from 'stream';

export interface SavedFileInfo {
  fileName: string;
  fileUrl: string;
  storageKey: string;
  fileSize: number;
  mimeType: string;
}

export interface IStorageProvider {
  /**
   * Saves a file buffer or stream to storage
   */
  saveFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    subfolder?: string
  ): Promise<SavedFileInfo>;

  /**
   * Retrieves a file as a readable stream along with metadata
   */
  getFileStream(storageKey: string): Promise<{
    stream: Readable;
    mimeType?: string;
    fileSize?: number;
  }>;

  /**
   * Retrieves file as a full buffer (e.g. for small files/checks)
   */
  getFileBuffer(storageKey: string): Promise<Buffer>;

  /**
   * Deletes a stored file
   */
  deleteFile(storageKey: string): Promise<void>;
}
