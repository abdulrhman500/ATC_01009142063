import { PrismaClient, Booking as PrismaBooking } from '@prisma/client';
import { injectable, inject } from 'inversify';
import { TYPES } from '@config/types';
import {IBookingRepository  }from '@src/domain/booking/interfaces/IBookingRepository';
// import Booking from '@domain/booking/Booking'; // Define this if you have a rich Booking domain entity

@injectable()
export class PrismaBookingRepository implements IBookingRepository {
    constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

    async findUserBookedEventIds(userId: string | number, eventIds: number[]): Promise<Set<number>> {
        if (!userId || eventIds.length === 0) {
            return new Set<number>();
        }

        // Ensure userId is a number if your schema's userId is Int
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        if (isNaN(numericUserId)) {
             console.error("Invalid userId provided to findUserBookedEventIds:", userId);
             return new Set<number>();
        }


        const bookings = await this.prisma.booking.findMany({
            where: {
                userId: numericUserId,
                eventId: {
                    in: eventIds,
                },
            },
            select: {
                eventId: true,
            },
        });

        // Filter out null eventIds before adding to the Set
        return new Set(bookings.map(b => b.eventId).filter(id => id !== null) as number[]);
    }

}