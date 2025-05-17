import Venue from '@domain/event/value-objects/Venue'; // Assuming your Venue VO is the primary representation
// Or import a Venue domain entity if you have one separate from the VO used in Event
// For simplicity, let's assume Venue VO might be fetched or validated directly for now.
// A full Venue domain entity and repository would be more robust.

export interface IVenueRepository {
    findByName(name: string): unknown;
    findById(id: number): Promise<Venue | null>; // Return Venue VO or domain entity
    findAll(): Promise<Venue[]>;
    save(venue: Venue): Promise<Venue>
    // ... other methods like save, findByName etc.
}