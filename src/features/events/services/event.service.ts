import { FirestoreService } from '@/services/firestoreService';
import { Event } from '@/app/types';
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export const eventConverter: FirestoreDataConverter<Event> = {
    toFirestore(event: Event) {
        // Exclude the 'id' field when saving to firestore as the document ID replaces it
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataToSave } = event;
        return dataToSave;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Event {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data
        } as Event;
    }
};

/**
 * Service specifically for managing Events.
 * Features all basic CRUD operations inherited from FirestoreService.
 */
class EventService extends FirestoreService<Event> {
    constructor() {
        super('events', eventConverter);
    }

    async saveEvent(event: Event): Promise<void> {
        await this.create(event.id, event);
    }

    /**
     * Appends an interaction session to the event's log.
     * Uses Firestore's arrayUnion to prevent race conditions during concurrent updates.
     */
    async logInteractionSession(eventId: string, session: Record<string, unknown>): Promise<void> {
        const { arrayUnion } = await import('firebase/firestore');
        // Type assertion needed because arrayUnion returns FieldValue which isn't directly compatible with Event type definition
        await this.update(eventId, {
            interactionSessions: arrayUnion(session) as unknown as Event['interactionSessions']
        });
    }
}

export const eventService = new EventService();
