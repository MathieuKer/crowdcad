import { pb } from './client';
import type { IDbService } from '../IDbService';
import type { DocSnapshot, QueryConstraint, TransactionContext, Unsubscribe } from '../types';
import { isArrayUnion, isArrayRemove, ServiceError } from '../types';

function toServiceError(err: unknown): ServiceError {
  if (err && typeof err === 'object' && 'status' in err) {
    const pbErr = err as { status: number; message: string };
    const code =
      pbErr.status === 404 ? 'not-found' :
      pbErr.status === 403 ? 'permission-denied' :
      pbErr.status === 401 ? 'unauthenticated' :
      `pocketbase/${pbErr.status}`;
    return new ServiceError(code, pbErr.message);
  }
  if (err instanceof Error) return new ServiceError('unknown', err.message);
  return new ServiceError('unknown', String(err));
}

function toSnapshot<T>(record: Record<string, unknown>): DocSnapshot<T> {
  return { id: record.id as string, exists: true, data: record as T };
}

/** Build a PocketBase filter string from QueryConstraints. */
function buildFilter(constraints: QueryConstraint[]): string {
  if (!constraints.length) return '';
  return constraints
    .map((c) => {
      const val = typeof c.value === 'string' ? `"${c.value}"` : String(c.value);
      if (c.op === '==') return `${c.field} = ${val}`;
      if (c.op === 'array-contains') return `${c.field} ~ ${val}`;
      return '';
    })
    .filter(Boolean)
    .join(' && ');
}

export class PocketbaseDbService implements IDbService {
  async getDocument<T>(col: string, id: string): Promise<DocSnapshot<T>> {
    try {
      const record = await pb.collection(col).getOne(id);
      return toSnapshot<T>(record as unknown as Record<string, unknown>);
    } catch (err) {
      const sErr = toServiceError(err);
      if (sErr.code === 'not-found') {
        return { id, exists: false, data: null };
      }
      throw sErr;
    }
  }

  async getCollection<T>(col: string): Promise<DocSnapshot<T>[]> {
    try {
      const records = await pb.collection(col).getFullList();
      return records.map((r) => toSnapshot<T>(r as unknown as Record<string, unknown>));
    } catch (err) {
      throw toServiceError(err);
    }
  }

  async queryCollection<T>(col: string, constraints: QueryConstraint[]): Promise<DocSnapshot<T>[]> {
    try {
      const filter = buildFilter(constraints);
      const records = await pb.collection(col).getFullList({ filter: filter || undefined });
      return records.map((r) => toSnapshot<T>(r as unknown as Record<string, unknown>));
    } catch (err) {
      throw toServiceError(err);
    }
  }

  async addDocument<T>(col: string, data: T): Promise<string> {
    try {
      const record = await pb.collection(col).create(data as Record<string, unknown>);
      return (record as unknown as Record<string, unknown>).id as string;
    } catch (err) {
      throw toServiceError(err);
    }
  }

  async setDocument<T>(
    col: string,
    id: string,
    data: Partial<T>,
    _options?: { merge?: boolean },
  ): Promise<void> {
    try {
      try {
        await pb.collection(col).update(id, data as Record<string, unknown>);
      } catch (err) {
        const sErr = toServiceError(err);
        if (sErr.code === 'not-found') {
          await pb.collection(col).create({ id, ...(data as Record<string, unknown>) });
        } else {
          throw sErr;
        }
      }
    } catch (err) {
      if (err instanceof ServiceError) throw err;
      throw toServiceError(err);
    }
  }

  async updateDocument(col: string, id: string, data: Record<string, unknown>): Promise<void> {
    // Detect if any FieldValue sentinels need a read-modify-write
    const hasArrayOps = Object.values(data).some(
      (v) => isArrayUnion(v) || isArrayRemove(v),
    );

    if (hasArrayOps) {
      // Read current document, apply array operations, then write
      const snap = await this.getDocument<Record<string, unknown>>(col, id);
      const current = snap.data ?? {};
      const resolved: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(data)) {
        if (isArrayUnion(value)) {
          const existing = Array.isArray(current[key]) ? (current[key] as unknown[]) : [];
          const toAdd = value.items.filter(
            (item) => !existing.some((e) => JSON.stringify(e) === JSON.stringify(item)),
          );
          resolved[key] = [...existing, ...toAdd];
        } else if (isArrayRemove(value)) {
          const existing = Array.isArray(current[key]) ? (current[key] as unknown[]) : [];
          resolved[key] = existing.filter(
            (e) => !value.items.some((item) => JSON.stringify(item) === JSON.stringify(e)),
          );
        } else {
          resolved[key] = value;
        }
      }

      try {
        await pb.collection(col).update(id, resolved);
      } catch (err) {
        throw toServiceError(err);
      }
    } else {
      try {
        await pb.collection(col).update(id, data);
      } catch (err) {
        throw toServiceError(err);
      }
    }
  }

  async deleteDocument(col: string, id: string): Promise<void> {
    try {
      await pb.collection(col).delete(id);
    } catch (err) {
      throw toServiceError(err);
    }
  }

  /**
   * PocketBase does not support multi-document atomic transactions.
   * This implementation is a sequential read-modify-write. For CrowdCAD's
   * dispatch use case (single document, low write concurrency), this is
   * acceptable. A concurrent write could cause the last writer to win.
   */
  async runTransaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const pendingWrites: Array<() => Promise<void>> = [];

    const ctx: TransactionContext = {
      async get<U>(col: string, id: string): Promise<DocSnapshot<U>> {
        const record = await pb.collection(col).getOne(id);
        return toSnapshot<U>(record as unknown as Record<string, unknown>);
      },
      set<U>(col: string, id: string, data: Partial<U>) {
        pendingWrites.push(async () => {
          try {
            await pb.collection(col).update(id, data as Record<string, unknown>);
          } catch {
            await pb.collection(col).create({ id, ...(data as Record<string, unknown>) });
          }
        });
      },
      update<U>(col: string, id: string, data: Partial<U>) {
        pendingWrites.push(async () => {
          await pb.collection(col).update(id, data as Record<string, unknown>);
        });
      },
      delete(col: string, id: string) {
        pendingWrites.push(async () => {
          await pb.collection(col).delete(id);
        });
      },
    };

    const result = await fn(ctx);
    for (const write of pendingWrites) {
      await write();
    }
    return result;
  }

  subscribeToDocument<T>(
    col: string,
    id: string,
    callback: (snapshot: DocSnapshot<T>) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    let cancelled = false;

    // Fire immediately with current state
    this.getDocument<T>(col, id)
      .then((snap) => { if (!cancelled) callback(snap); })
      .catch((err) => { if (!cancelled) onError?.(err); });

    // Subscribe to realtime changes
    pb.collection(col).subscribe(id, (event) => {
      if (event.action === 'delete') {
        callback({ id, exists: false, data: null });
      } else {
        callback(toSnapshot<T>(event.record as unknown as Record<string, unknown>));
      }
    }).catch((err) => onError?.(toServiceError(err)));

    return () => {
      cancelled = true;
      pb.collection(col).unsubscribe(id);
    };
  }

  subscribeToQuery<T>(
    col: string,
    constraints: QueryConstraint[],
    callback: (snapshots: DocSnapshot<T>[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    let cancelled = false;
    const filter = buildFilter(constraints);

    const refetch = () =>
      pb.collection(col)
        .getFullList({ filter: filter || undefined })
        .then((records) => {
          if (!cancelled)
            callback(records.map((r) => toSnapshot<T>(r as unknown as Record<string, unknown>)));
        })
        .catch((err) => { if (!cancelled) onError?.(toServiceError(err)); });

    // Initial load
    refetch();

    // Re-fetch on any change in the collection
    pb.collection(col).subscribe('*', () => { if (!cancelled) refetch(); })
      .catch((err) => onError?.(toServiceError(err)));

    return () => {
      cancelled = true;
      pb.collection(col).unsubscribe('*');
    };
  }
}
