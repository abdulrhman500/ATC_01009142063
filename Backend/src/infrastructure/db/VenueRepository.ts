import { PrismaClient, Venue as PrismaVenue, Prisma } from '@prisma/client';
import { injectable, inject } from 'inversify';
import { TYPES } from '@config/types';
import { IVenueRepository } from '@domain/event/interfaces/IVenueRepository'; // Adjust path
import VenueVO from '@domain/event/value-objects/Venue';

@injectable()
export default class PrismaVenueRepository implements IVenueRepository {
    constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}
    async findByName(name: string): Promise<VenueVO | null> {
        if (!name || name.trim() === '') {
            // Optionally handle empty name string if it's not a valid lookup,
            // though findUnique with an empty string on a unique field might just return null.
            return null;
        }
        const prismaVenue = await this.prisma.venue.findUnique({
            where: {
                name: name, // Since 'name' is @unique in your Prisma schema for Venue
            },
        });

        if (!prismaVenue) {
            return null;
        }
        return this.mapToDomain(prismaVenue);
    }

    private mapToDomain(prismaVenue: PrismaVenue): VenueVO {
        return new VenueVO.Builder()
            .withId(prismaVenue.id)
            .withName(prismaVenue.name)
            .withStreet(prismaVenue.street)
            .withCity(prismaVenue.city)
            .withCountry(prismaVenue.country)
            .withState(prismaVenue.state)
            .withPostalCode(prismaVenue.postalCode ?? undefined)
            .withPlaceUrl(prismaVenue.placeUrl ?? undefined)
            .build();
    }

    // Helper to convert domain VenueVO to Prisma data, excluding ID for create
    private mapToPrismaCreateData(domainVenue: VenueVO): Prisma.VenueCreateInput {
        return {
            name: domainVenue.name,
            street: domainVenue.street,
            city: domainVenue.city,
            state: domainVenue.state,
            country: domainVenue.country,
            postalCode: domainVenue.postalCode,
            placeUrl: domainVenue.placeUrl,
        };
    }

    // Helper for Prisma update data
    private mapToPrismaUpdateData(domainVenue: VenueVO): Prisma.VenueUpdateInput {
        // For update, we might not want to update 'name' if it's a unique key being used in 'where'
        // This method would be more nuanced for partial updates.
        // For simplicity, assuming full update of provided fields.
        return {
            name: domainVenue.name,
            street: domainVenue.street,
            city: domainVenue.city,
            state: domainVenue.state,
            country: domainVenue.country,
            postalCode: domainVenue.postalCode,
            placeUrl: domainVenue.placeUrl,
        };
    }


    async findById(id: number): Promise<VenueVO | null> {
        const prismaVenue = await this.prisma.venue.findUnique({ where: { id } });
        return prismaVenue ? this.mapToDomain(prismaVenue) : null;
    }

    async findAll(): Promise<VenueVO[]> {
        const prismaVenues = await this.prisma.venue.findMany({ orderBy: { name: 'asc' } });
        return prismaVenues.map(pv => this.mapToDomain(pv));
    }

    async save(venue: VenueVO): Promise<VenueVO> {
        let savedPrismaVenue: PrismaVenue;
        if (venue.id === -1) { // Indicates a new venue from our builder pattern
            const createData = this.mapToPrismaCreateData(venue);
            savedPrismaVenue = await this.prisma.venue.create({ data: createData });
        } else { // Existing venue to update
            const updateData = this.mapToPrismaUpdateData(venue);
            savedPrismaVenue = await this.prisma.venue.update({
                where: { id: venue.id },
                data: updateData,
            });
        }
        return this.mapToDomain(savedPrismaVenue);
    }
}