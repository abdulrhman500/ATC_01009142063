import { inject, injectable } from 'inversify';
import { TYPES } from '@config/types';
import { CreateEventCommand } from '@application/event/commands/CreateEventCommand';
import IEventRepository from '@domain/event/interfaces/IEventRepository';
import ICategoryRepository from '@domain/category/interfaces/ICategoryRepository';
import  {IVenueRepository  }from '@domain/event/interfaces/IVenueRepository'; // Ensure this path
import Event from '@domain/event/Event';
import EventName from '@domain/event/value-objects/EventName';
import EventDescription from '@domain/event/value-objects/EventDescription';
import EventDate from '@domain/event/value-objects/EventDate';
import VenueVO from '@domain/event/value-objects/Venue';
import EventPrice from '@domain/event/value-objects/EventPrice';
import EventPhotoUrl from '@domain/event/value-objects/EventPhotoUrl';
import { NotFoundException, BadRequestException } from '@shared/exceptions/http.exception';
import Category from '@src/domain/category/Category';
export interface CreateEventResult { // Define a result type for the handler
    event: Event;
    category?: Category;
}
@injectable()
export class CreateEventHandler {
    constructor(
        @inject(TYPES.IEventRepository) private readonly eventRepository: IEventRepository,
        @inject(TYPES.ICategoryRepository) private readonly categoryRepository: ICategoryRepository,
        @inject(TYPES.IVenueRepository) private readonly venueRepository: IVenueRepository // Inject VenueRepository
    ) {}

    async execute(command: CreateEventCommand): Promise<CreateEventResult> { // Return CreateEventResult
        const venueDomainObject = await this.venueRepository.findById(command.venueId);
        if (!venueDomainObject) {
            throw new BadRequestException(`Venue with ID ${command.venueId} not found.`);
        }

        let associatedCategory: Category | undefined = undefined;
        if (command.categoryId != null) {
            const categoryDomainObject = await this.categoryRepository.findById(command.categoryId);
            if (!categoryDomainObject) {
                throw new BadRequestException(`Category with ID ${command.categoryId} not found.`);
            }
            associatedCategory = categoryDomainObject;
        }

        const eventName = new EventName(command.name);
        const eventDescription = new EventDescription(command.description);
        const eventDate = new EventDate(command.date);
        const eventPrice = new EventPrice(command.priceValue, command.priceCurrency);
        const eventPhotoUrl = command.photoUrl ? new EventPhotoUrl(command.photoUrl) : undefined;

        const newEventEntity = new Event.builder()
            .setName(eventName)
            .setDescription(eventDescription)
            .setDate(eventDate)
            .setLocation(venueDomainObject)
            .setPrice(eventPrice)
            .setPhotoUrl(eventPhotoUrl)
            .setCategoryId(command.categoryId)
            .build();

        const savedEvent = await this.eventRepository.save(newEventEntity);
        
        return { event: savedEvent, category: associatedCategory }; 
    }
}