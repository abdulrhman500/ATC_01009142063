import { injectable, inject } from "inversify";
import { TYPES } from "@src/config/types";
import  { IBookingRepository } from "@src/domain/booking/interfaces/IBookingRepository";
import CreateBookingCommand  from "@src/application/booking/commands/CreateBookingCommand";
import Booking  from "@domain/booking/Booking";

@injectable()
export default class CreateBookingHandler {
  constructor(
    @inject(TYPES.IBookingRepository)
    private readonly bookingRepository: IBookingRepository
  ) {}

  async execute(command: CreateBookingCommand): Promise<void> {
   

   
    const newBooking: Booking=   await this.bookingRepository.createBooking(command.userId, command.eventId);
    if(!newBooking){
        throw new Error("Booking creation failed");
    }
    return; 
  }
}