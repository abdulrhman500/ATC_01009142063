import {
    PrismaClient,
    Event as PrismaEventType, // Alias for Prisma's generated Event type
    Venue as PrismaVenueType,
    Category as PrismaCategoryType,
    Prisma // For Prisma utility types like WhereInput and Payloads
} from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '@src/config/types';
import IEventRepository, { FindEventsPaginatedParams, PaginatedEventsResult } from '@domain/event/interfaces/IEventRepository';
import Event from '@domain/event/Event'; // Your Domain Event entity
import EventName from '@domain/event/value-objects/EventName';
import EventDescription from '@domain/event/value-objects/EventDescription';
import EventDate from '@domain/event/value-objects/EventDate';
import VenueVO from '@domain/event/value-objects/Venue'; // Your Venue Value Object
import EventPrice from '@domain/event/value-objects/EventPrice';
import EventPhotoUrl from '@domain/event/value-objects/EventPhotoUrl';

// Define a more specific type for Prisma Event with its relations included
type PrismaEventWithRelations = Prisma.EventGetPayload<{
    include: { venue: true, category: true }
}>;

@injectable()
export default class PrismaEventRepository implements IEventRepository {
    constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) { }

    private mapToDomain(prismaEventData: PrismaEventWithRelations): Event {
        const photoUrlVO = prismaEventData.photoUrl
            ? new EventPhotoUrl(prismaEventData.photoUrl)
            : undefined;

    

        return new Event.builder()
            .setId(prismaEventData.id)
            .setName(new EventName(prismaEventData.name))
            .setDescription(new EventDescription(prismaEventData.description))
            .setDate(new EventDate(prismaEventData.date))
            .setLocation(
                new VenueVO.Builder()
                    .withId(prismaEventData.venue.id)
                    .withName(prismaEventData.venue.name)
                    .withStreet(prismaEventData.venue.street)
                    .withCity(prismaEventData.venue.city)
                    .withCountry(prismaEventData.venue.country)
                    .withState(prismaEventData.venue.state || undefined)
                    .withPostalCode(prismaEventData.venue.postalCode ?? undefined)
                    .withPlaceUrl(prismaEventData.venue.placeUrl ?? undefined)
                    .build()
            )
            .setPrice(new EventPrice(prismaEventData.priceValue, prismaEventData.priceCurrency))
            .setPhotoUrl(photoUrlVO)
            .setCategoryId(prismaEventData.categoryId)
            .build();
    }

    private mapToPrismaData(domainEvent: Event): Omit<Prisma.EventCreateInput, 'venue' | 'category'> & { venueId: number, categoryId?: number | null } {
        const data = {
            name: domainEvent.name.value,
            description: domainEvent.description.value,
            date: domainEvent.date.value,
            venueId: domainEvent.location.id, // Event.location is VenueVO which has an id
            photoUrl: domainEvent.photoUrl ?? null, // Use getter and provide null if undefined
            priceValue: domainEvent.price.value,
            priceCurrency: domainEvent.price.currency,
            categoryId: domainEvent.getCategoryId() ?? null, // Ensure null if undefined
        };
        // This explicit typing helps, Prisma often infers well if types are exact.
        return data as Omit<Prisma.EventCreateInput, 'venue' | 'category'> & { venueId: number, categoryId?: number | null };
    }


    async findPaginated(params: FindEventsPaginatedParams): Promise<PaginatedEventsResult> {
        const { page, limit, textSearch, categoryIds } = params;
        const skip = (page - 1) * limit; // page and limit should be numbers here

        const whereConditions: Prisma.EventWhereInput[] = [];

        if (textSearch && textSearch.trim() !== '') {
            const searchText = textSearch.trim();
            whereConditions.push({
                OR: [
                    { name: { contains: searchText, mode: 'insensitive' } },
                    { description: { contains: searchText, mode: 'insensitive' } },
                ],
            });
        }

        if (categoryIds && categoryIds.length > 0) {
            whereConditions.push({
                categoryId: { in: categoryIds },
            });
        }

        const finalWhereClause: Prisma.EventWhereInput = whereConditions.length > 0 ? { AND: whereConditions } : {};

        const [prismaEvents, totalCount] = await this.prisma.$transaction([
            this.prisma.event.findMany({
                where: finalWhereClause,
                include: {
                    venue: true,
                    category: true,
                },
                skip: skip, // Already number
                take: limit, // Already number
                orderBy: { date: 'desc' }, // As per your working tests
            }),
            this.prisma.event.count({ where: finalWhereClause }),
        ]);

        const events = prismaEvents.map(pe => this.mapToDomain(pe as PrismaEventWithRelations));
        return { events, totalCount };
    }

    async findById(id: number): Promise<Event | null> {
        const prismaEvent = await this.prisma.event.findUnique({
            where: { id },
            include: { venue: true, category: true },
        });
        return prismaEvent ? this.mapToDomain(prismaEvent) : null;
    }

    async save(event: Event): Promise<Event> {
        const prismaData = this.mapToPrismaData(event);
        let savedPrismaEvent: PrismaEventWithRelations;

        // Event.id is number, builder sets to -1 for new.
        if (event.id === -1) {
            savedPrismaEvent = await this.prisma.event.create({
                data: prismaData as unknown as Prisma.EventCreateInput, // Cast as EventCreateInput
                include: { venue: true, category: true },
            });
        } else {
            savedPrismaEvent = await this.prisma.event.update({
                where: { id: event.id },
                data: prismaData as Prisma.EventUpdateInput, // Cast as EventUpdateInput
                include: { venue: true, category: true },
            });
        }
        return this.mapToDomain(savedPrismaEvent);
    }

    async reassignEventsCategory(oldCategoryId: number, newCategoryId: number): Promise<void> {
        await this.prisma.event.updateMany({
            where: { categoryId: oldCategoryId },
            data: { categoryId: newCategoryId },
        });
    }

    // Add delete method if it's part of your IEventRepository interface
    async deleteById(id: number): Promise<boolean> {
        try {
            await this.prisma.event.delete({ where: { id } });
            return true;
        } catch (error: any) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                // Record to delete not found
                return false;
            }
            throw error; // Re-throw other errors
        }
    }
}