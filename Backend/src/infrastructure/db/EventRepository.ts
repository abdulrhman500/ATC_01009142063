import { inject, injectable } from 'inversify';
import { TYPES } from '@src/config/types';
import { PrismaClient, Event as PrismaEvent, Venue as PrismaVenue, Category as PrismaCategory } from '@prisma/client';
import IEventRepository, { FindEventsPaginatedParams, PaginatedEventsResult } from '@domain/event/interfaces/IEventRepository';
import Event from '@domain/event/Event';
import EventName from '@domain/event/value-objects/EventName';
import EventDescription from '@domain/event/value-objects/EventDescription';
import EventDate from '@domain/event/value-objects/EventDate';
import VenueVO from '@domain/event/value-objects/Venue'; // Your Venue VO
import EventPrice from '@domain/event/value-objects/EventPrice';
import EventPhotoUrl from '@domain/event/value-objects/EventPhotoUrl';

@injectable()
export default class PrismaEventRepository implements IEventRepository {
    constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) { }

    // Helper to map Prisma Event to Domain Event
    private mapToDomain(prismaEvent: PrismaEvent & { venue: PrismaVenue, category?: PrismaCategory | null }): Event {
        // Assuming your Event.builder or constructor can handle this data
        // This mapping needs to be robust based on your Event domain entity and VOs
        return new Event.builder()
            .setId(prismaEvent.id)
            .setName(new EventName(prismaEvent.name))
            .setDescription(new EventDescription(prismaEvent.description))
            .setDate(new EventDate(prismaEvent.date))
            .setLocation(
                new VenueVO.Builder() // Assuming VenueVO has a builder
                    .withId(prismaEvent.venue.id)
                    .withName(prismaEvent.venue.name)
                    .withStreet(prismaEvent.venue.street)
                    .withCity(prismaEvent.venue.city)
                    .withCountry(prismaEvent.venue.country)
                    .withState(prismaEvent.venue.state || undefined)
                    .withPostalCode(prismaEvent.venue.postalCode || undefined)
                    .withPlaceUrl(prismaEvent.venue.placeUrl || undefined)
                    .build()
            )
            .setPrice(new EventPrice(prismaEvent.priceValue, prismaEvent.priceCurrency))
            .setPhotoUrl(new EventPhotoUrl(prismaEvent.photoUrl))
            // category mapping would be needed if Event domain entity holds a Category domain object
            .build();
    }

    async findPaginated(params: FindEventsPaginatedParams): Promise<PaginatedEventsResult> {
        const { page, limit, textSearch, categoryIds } = params;
        const skip = (page - 1) * limit;
        console.log("textSearch", textSearch);
        console.log("categoryIds", categoryIds);
        console.log("skip", skip);
        console.log("limit", limit);
        console.log("page", page);
        console.log("ggggggggggggggggggg");
        
        
        

        const whereClause: any = { AND: [] }; // Prisma.EventWhereInput equivalent

        if (textSearch && textSearch.trim() !== '') {
            // Using Prisma's full-text search `search` if you've defined @@fulltext index
            // The query needs to be formatted for tsquery (e.g., 'word1 & word2', 'word1 | word2')
            // A simple approach is to split words and join with '&' or use plainto_tsquery compatible format
            const searchQuery = textSearch.trim().split(/\s+/).join(' & ');
            // whereClause.AND.push({ // TODO
            //     OR: [
            //         { name: { search: searchQuery } },
            //         { description: { search: searchQuery } },
            //     ],
            // });
            // Fallback if FTS index is not set up or for simpler 'contains'
            whereClause.AND.push({
              OR: [
                { name: { contains: textSearch, mode: 'insensitive' } },
                { description: { contains: textSearch, mode: 'insensitive' } },
              ],
            });
        }

        if (categoryIds && categoryIds.length > 0) {
            whereClause.AND.push({
                categoryId: { in: categoryIds },
            });
        }

        // Remove AND if it's empty to avoid Prisma errors
        if (whereClause.AND.length === 0) {
            delete whereClause.AND;
        }


        const [prismaEvents, totalCount] = await this.prisma.$transaction([
            this.prisma.event.findMany({
                where: whereClause,
                include: {
                    venue: true, // Include venue data for mapping to VenueVO
                    category: true, // Include category for mapping or display
                },
                skip: Number(skip),
                take: Number(limit),
                orderBy: { date: 'desc' }, // Example ordering
            }),
            this.prisma.event.count({ where: whereClause }),
        ]);

        const events = prismaEvents.map(pe => this.mapToDomain(pe as any)); // Cast as any to satisfy include types temporarily

        return { events, totalCount };
    }

    async findById(id: number): Promise<Event | null> {
        const prismaEvent = await this.prisma.event.findUnique({
            where: { id },
            include: { venue: true, category: true },
        });
        return prismaEvent ? this.mapToDomain(prismaEvent as any) : null;
    }


    async reassignEventsCategory(oldCategoryId: number, newCategoryId: number): Promise<void> {
        await this.prisma.event.updateMany({
            where: { categoryId: oldCategoryId },
            data: { categoryId: newCategoryId },
        });
    }
}