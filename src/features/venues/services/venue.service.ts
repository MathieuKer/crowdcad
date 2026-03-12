import { FirestoreService } from '@/services/firestoreService';
import { Venue } from '@/app/types';
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export const venueConverter: FirestoreDataConverter<Venue> = {
    toFirestore(venue: Venue) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataToSave } = venue;
        return dataToSave;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Venue {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data
        } as Venue;
    }
};

/**
 * Service specifically for managing Venues.
 * Interacts with the base firestore service.
 */
class VenueService extends FirestoreService<Venue> {
    constructor() {
        super('venues', venueConverter);
    }

    async saveVenue(venue: Venue): Promise<void> {
        await this.create(venue.id, venue);
    }

    async deleteVenue(id: string): Promise<void> {
        await this.delete(id);
    }
}

export const venueService = new VenueService();
