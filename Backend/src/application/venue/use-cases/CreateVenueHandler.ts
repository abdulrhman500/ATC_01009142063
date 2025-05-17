import { inject, injectable } from 'inversify';
import { TYPES } from '@config/types';
import { CreateVenueCommand } from '@application/venue/commands/CreateVenueCommand'; // Adjust path
import { IVenueRepository } from '@domain/event/interfaces/IVenueRepository'; // Adjust path
import VenueVO from '@domain/event/value-objects/Venue'; // Your Venue VO
import { BadRequestException } from '@shared/exceptions/http.exception'; // For unique name check

@injectable()
export class CreateVenueHandler {
    constructor(
        @inject(TYPES.IVenueRepository) private readonly venueRepository: IVenueRepository // Assuming TYPES.VenueRepository
    ) {}

    async execute(command: CreateVenueCommand): Promise<VenueVO> {
        // Assuming venue names should be unique (as per upsert logic in helper)
        // If not, remove this check. If yes, ICategoryRepository also needs findByName.
        // For simplicity for "very very simple", this check might be omitted if upsert handles it
        // or if names don't need to be unique for creation.
        // However, since createVenue helper used upsert on name, let's assume name uniqueness is desired.
        // This implies IVenueRepository needs a findByName method. Let's add it.

        // This check is better if findByName is on IVenueRepository
        const existingVenue = await this.venueRepository.findByName(command.name);
        if (existingVenue) {
            throw new BadRequestException(`Venue with name "${command.name}" already exists.`);
        }
        // For "very simple", and if the DB has a unique constraint on name,
        // the save operation itself would fail, which is then caught.
        // Or, the upsert logic in the test helper handles "find or create".
        // Let's assume the repository's save will create if ID is -1.

        const newVenue = new VenueVO.Builder()
            .withName(command.name)
            .withStreet(command.street)
            .withCity(command.city)
            .withCountry(command.country)
            .withState(command.state || "N/A")
            .withPostalCode(command.postalCode || undefined)
            .withPlaceUrl(command.placeUrl || undefined)
            // .withId(-1) // Builder defaults to -1
            .build(); // This will use id: -1

        return this.venueRepository.save(newVenue);
    }
}