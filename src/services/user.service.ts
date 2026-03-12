import { FirestoreService } from './firestoreService';
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export interface AppUser {
    id: string;
    lastPasswordChange?: Date;
    [key: string]: unknown;
}

export const userConverter: FirestoreDataConverter<AppUser> = {
    toFirestore(user: AppUser) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataToSave } = user;
        return dataToSave;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): AppUser {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data,
            lastPasswordChange: data.lastPasswordChange?.toDate ? data.lastPasswordChange.toDate() : data.lastPasswordChange,
        } as AppUser;
    }
};

class UserService extends FirestoreService<AppUser> {
    constructor() {
        super('users', userConverter);
    }
}

export const userService = new UserService();
