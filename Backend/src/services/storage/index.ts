import { IStorageProvider } from './StorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';

let storageInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageInstance) {
    const providerType = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

    switch (providerType) {
      case 'local':
      default:
        storageInstance = new LocalStorageProvider();
        break;
      // Future cloud providers (S3, R2, Supabase) plug in here seamlessly:
      // case 's3':
      //   storageInstance = new S3StorageProvider();
      //   break;
    }
  }

  return storageInstance;
}

export * from './StorageProvider';
export * from './LocalStorageProvider';
