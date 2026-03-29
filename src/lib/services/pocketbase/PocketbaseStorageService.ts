import { pb } from './client';
import type { IStorageService } from '../IStorageService';
import { ServiceError } from '../types';

/**
 * PocketBase storage adapter.
 *
 * Files are stored in a dedicated `_storage` collection with two fields:
 *   - path  (text, unique index) — the logical path used by the app
 *   - file  (file field)         — the uploaded binary
 *
 * Create this collection in PocketBase Admin → Collections → New collection
 * named `_storage` with fields `path` (text, required, unique) and `file` (file).
 */

function toServiceError(err: unknown): ServiceError {
  if (err && typeof err === 'object' && 'status' in err) {
    const pbErr = err as { status: number; message: string };
    return new ServiceError(`pocketbase/${pbErr.status}`, pbErr.message);
  }
  if (err instanceof Error) return new ServiceError('unknown', err.message);
  return new ServiceError('unknown', String(err));
}

export class PocketbaseStorageService implements IStorageService {
  async uploadFile(path: string, file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('path', path);
      formData.append('file', file);

      // Try to find existing record by path
      let record: Record<string, unknown>;
      const existing = await pb.collection('_storage').getFullList({
        filter: `path = "${path}"`,
      });

      if (existing.length > 0) {
        const id = (existing[0] as unknown as Record<string, unknown>).id as string;
        record = (await pb.collection('_storage').update(id, formData)) as unknown as Record<string, unknown>;
      } else {
        record = (await pb.collection('_storage').create(formData)) as unknown as Record<string, unknown>;
      }

      return this._buildUrl(record);
    } catch (err) {
      throw toServiceError(err);
    }
  }

  async getDownloadURL(path: string): Promise<string> {
    try {
      const records = await pb.collection('_storage').getFullList({
        filter: `path = "${path}"`,
      });
      if (!records.length) {
        throw new ServiceError('not-found', `No file found at path: ${path}`);
      }
      return this._buildUrl(records[0] as unknown as Record<string, unknown>);
    } catch (err) {
      if (err instanceof ServiceError) throw err;
      throw toServiceError(err);
    }
  }

  private _buildUrl(record: Record<string, unknown>): string {
    const id = record.id as string;
    const filename = record.file as string;
    return `${pb.baseURL}/api/files/_storage/${id}/${filename}`;
  }
}
