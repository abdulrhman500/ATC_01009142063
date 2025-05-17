import Booking from '@domain/booking/Booking'; // Assuming you'll have a Booking domain entity

export interface IBookingRepository {
    // Finds which of the given event IDs the user has booked
    findUserBookedEventIds(userId: string | number, eventIds: number[]): Promise<Set<number>>;
    // Add other methods like:
    createBooking(userId: string | number, eventId: string|number): Promise<Booking>;
    // findBookingByUserAndEvent(userId: string | number, eventId: number): Promise<Booking | null>;
    // cancelBooking(bookingId: string | number, userId: string | number): Promise<boolean>;
}