import { FirestoreService } from '@/services/firestoreService';
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, where } from 'firebase/firestore';

export interface DispatchLog {
    id: string;
    userId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Kept as any as it seems to be an open dictionary based on structure 
}

export const dispatchLogConverter: FirestoreDataConverter<DispatchLog> = {
    toFirestore(log: DispatchLog) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataToSave } = log;
        return dataToSave;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): DispatchLog {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data
        } as DispatchLog;
    }
};

class DispatchLogService extends FirestoreService<DispatchLog> {
    constructor() {
        super('dispatchLogs', dispatchLogConverter);
    }

    async getByUserId(userId: string): Promise<DispatchLog[]> {
        return this.getAll([where('userId', '==', userId)]);
    }
}

export const dispatchLogService = new DispatchLogService();
