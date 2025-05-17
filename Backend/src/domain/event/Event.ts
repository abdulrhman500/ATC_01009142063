import EventName from "@domain/event/value-objects/EventName";
import EventDescription from "@domain/event/value-objects/EventDescription";
import EventDate from "@domain/event/value-objects/EventDate";
import VenueVO from "@domain/event/value-objects/Venue"; // Ensure this is VenueVO
import EventPrice from "@domain/event/value-objects/EventPrice";
import EventPhotoUrl from "@domain/event/value-objects/EventPhotoUrl";

export default class Event {
    readonly id: number;
    readonly name: EventName;
    readonly description: EventDescription;
    readonly date: EventDate;
    readonly location: VenueVO;
    readonly price: EventPrice;
    readonly photoUrl?: EventPhotoUrl;
    readonly categoryId?: number | null; // Added

    private constructor(
        id: number, name: EventName, description: EventDescription, date: EventDate,
        location: VenueVO, price: EventPrice, photoUrl?: EventPhotoUrl,
        categoryId?: number | null, // Added
    ) {
        if (id <= 0 && id !== -1) { // Allow -1 for new events before saving
            throw new Error("Event ID must be a positive number or -1 for new events.");
        }
        this.id = id;
        this.name = name;
        this.description = description;
        this.date = date;
        this.location = location;
        this.price = price;
        this.photoUrl = photoUrl;
        this.categoryId = categoryId;
    }

    public getCategoryId(): number | null | undefined {
        return this.categoryId;
    }

   

    public static builder = class EventBuilder {
        private id?: number; // Default for new events
        private name?: EventName;
        private description?: EventDescription;
        private date?: EventDate;
        private location?: VenueVO;
        private price?: EventPrice;
        private photoUrl?: EventPhotoUrl;
        private categoryId?: number | null;

        setId(id: number): this { this.id = id; return this; }
        setName(name: EventName): this { this.name = name; return this; }
        setDescription(description: EventDescription): this { this.description = description; return this; }
        setDate(date: EventDate): this { this.date = date; return this; }
        setLocation(location: VenueVO): this { this.location = location; return this; }
        setPrice(price: EventPrice): this { this.price = price; return this; }
        setPhotoUrl(url: EventPhotoUrl|undefined): this { this.photoUrl = url; return this; }
        setCategoryId(categoryId: number | null | undefined): this {
            this.categoryId = categoryId;
            return this;
        }
      

        build(): Event {
            if (this.id == null || !this.name || !this.description || !this.date || !this.location ||
                !this.price || !this.photoUrl) {
                throw new Error("Missing required fields for Event.");
            }
            return new Event(
                this.id, this.name, this.description, this.date, this.location,
                this.price, this.photoUrl, this.categoryId
            );
        }
    }
}