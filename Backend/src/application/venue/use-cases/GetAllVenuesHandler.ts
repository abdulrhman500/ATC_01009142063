import { inject, injectable } from 'inversify';
import { TYPES } from '@config/types';
import { IVenueRepository } from '@domain/event/interfaces/IVenueRepository'; // Adjust path
import VenueVO from '@domain/event/value-objects/Venue'; // Your Venue Value Object

@injectable()
export class GetAllVenuesHandler {
    constructor(
        @inject(TYPES.IVenueRepository) private readonly venueRepository: IVenueRepository
    ) {}

    async execute(): Promise<VenueVO[]> {
        return this.venueRepository.findAll();
    }
}