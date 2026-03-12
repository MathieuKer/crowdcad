import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    FirestoreDataConverter,
    QueryConstraint,
    query
} from 'firebase/firestore';
import { db } from '../app/firebase';

/**
 * Agnostic Firestore service for Clean Architecture.
 * This should be extended or wrapped by domain-specific services (e.g., VenueService)
 */
export class FirestoreService<T> {
    protected collectionName: string;
    protected converter: FirestoreDataConverter<T>;

    constructor(collectionName: string, converter: FirestoreDataConverter<T>) {
        this.collectionName = collectionName;
        this.converter = converter;
    }

    protected get collectionRef() {
        return collection(db, this.collectionName).withConverter(this.converter);
    }

    protected docRef(id: string) {
        return doc(db, this.collectionName, id).withConverter(this.converter);
    }

    async getAll(constraints?: QueryConstraint[]): Promise<T[]> {
        const q = constraints ? query(this.collectionRef, ...constraints) : this.collectionRef;
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => docSnap.data());
    }

    async getById(id: string): Promise<T | null> {
        const docSnap = await getDoc(this.docRef(id));
        if (!docSnap.exists()) return null;
        return docSnap.data();
    }

    async create(id: string, data: T): Promise<void> {
        await setDoc(this.docRef(id), data);
    }

    async upsert(id: string, data: Partial<T>): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await setDoc(this.docRef(id), data as any, { merge: true });
    }

    async update(id: string, data: Partial<T>): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateDoc(this.docRef(id), data as any);
    }

    async delete(id: string): Promise<void> {
        await deleteDoc(this.docRef(id));
    }

    async shareWith(id: string, email: string): Promise<void> {
        const { arrayUnion } = await import('firebase/firestore');
        await this.update(id, ({
            sharedWith: arrayUnion(email) as unknown
        } as unknown) as Partial<T>);
    }

    async unshareWith(id: string, email: string): Promise<void> {
        const { arrayRemove } = await import('firebase/firestore');
        await this.update(id, ({
            sharedWith: arrayRemove(email) as unknown
        } as unknown) as Partial<T>);
    }
}
