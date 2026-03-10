import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    DocumentData,
    WithFieldValue,
} from 'firebase/firestore';
import { db } from '../app/firebase';

/**
 * Agnostic Firestore service for Clean Architecture.
 * This should be extended or wrapped by domain-specific services (e.g., VenueService)
 */
export class FirestoreService<T extends DocumentData> {
    protected collectionName: string;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    protected get collectionRef() {
        return collection(db, this.collectionName);
    }

    protected docRef(id: string) {
        return doc(db, this.collectionName, id);
    }

    async getAll(): Promise<(T & { id: string })[]> {
        const snapshot = await getDocs(this.collectionRef);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...(docSnap.data() as T),
        }));
    }

    async getById(id: string): Promise<(T & { id: string }) | null> {
        const docSnap = await getDoc(this.docRef(id));
        if (!docSnap.exists()) return null;
        return {
            id: docSnap.id,
            ...(docSnap.data() as T),
        };
    }

    async create(id: string, data: WithFieldValue<T>): Promise<void> {
        await setDoc(this.docRef(id), data);
    }

    async update(id: string, data: Partial<T>): Promise<void> {
        // @ts-expect-error - updateDoc typing is too strict for generic Partial<T>
        await updateDoc(this.docRef(id), data);
    }

    async delete(id: string): Promise<void> {
        await deleteDoc(this.docRef(id));
    }
}
