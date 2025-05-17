import { PrismaClient, Venue as PrismaVenue } from '@prisma/client';
import { injectable, inject } from 'inversify';
import { TYPES } from '@config/types';
import { IVenueRepository } from '@domain/event/interfaces/IVenueRepository'; // Adjust path
import VenueVO from '@domain/event/value-objects/Venue';

@injectable()
export default class PrismaVenueRepository implements IVenueRepository {
    constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

    private mapToDomain(prismaVenue: PrismaVenue): VenueVO {
        return new VenueVO.Builder()
            .withId(prismaVenue.id)
            .withName(prismaVenue.name)
            .withStreet(prismaVenue.street)
            .withCity(prismaVenue.city)
            .withCountry(prismaVenue.country)
            .withState(prismaVenue.state || undefined)
            .withPostalCode(prismaVenue.postalCode ?? undefined)
            .withPlaceUrl(prismaVenue.placeUrl ?? undefined)
            .build();
    }

    async findById(id: number): Promise<VenueVO | null> {
        const prismaVenue = await this.prisma.venue.findUnique({ where: { id } });
        return prismaVenue ? this.mapToDomain(prismaVenue) : null;
    }
}