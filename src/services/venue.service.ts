import { FirestoreService } from './firestoreService';
import { Venue } from '../app/types';

/**
 * Service specifically for managing Venues.
 * Interacts with the base firestore service.
 */
class VenueService extends FirestoreService<Venue> {
    constructor() {
        super('venues');
    }

    /**
     * Extends the base creation to ensure auth bounds and timestamps if needed,
     * though the base `create` or `update` works seamlessly.
     */
    async saveVenue(venue: Venue): Promise<void> {
        await this.create(venue.id, venue);
    }

    async deleteVenue(id: string): Promise<void> {
        await this.delete(id);
    }
}

export const venueService = new VenueService();
