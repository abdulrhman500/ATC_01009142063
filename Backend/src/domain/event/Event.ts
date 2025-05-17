
import EventName from "@domain/event/value-objects/EventName";
import EventDescription from "@domain/event/value-objects/EventDescription";
import EventDate from "@domain/event/value-objects/EventDate";
import Venue from "@domain/event/value-objects/Venue";
import EventPrice from "@domain/event/value-objects/EventPrice";
import EventPhotoUrl from "@domain/event/value-objects/EventPhotoUrl";


export default class Event {
    readonly id: number;
    readonly name: EventName;
    readonly description: EventDescription;
    readonly date: EventDate;
    readonly location: Venue;
    readonly price: EventPrice;
    readonly photoUrl: EventPhotoUrl;
    readonly categoryId?: number | null; // Added categoryId


    private constructor(id: number, name: EventName, description: EventDescription, date: EventDate, location: Venue, price: EventPrice, photoUrl: EventPhotoUrl,categoryId?: number | null ) {
        if (id <= 0) {
            throw new Error("Event ID must be a positive number");
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
        private id?: number;
        private name?: EventName;
        private description?: EventDescription;
        private date?: EventDate;
        private location?: Venue;
        // private createdAt?: Date;
        // private lastupdatedAt?: Date;
        // private createdBy?: UserId;
        // private updatedBy?: UserId;
        private price?: EventPrice;
        private photoUrl?: EventPhotoUrl;
        private categoryId?: number | null;

        setId(id: number): this { this.id = id; return this; }
        setName(name: EventName): this { this.name = name; return this; }
        setDescription(description: EventDescription): this { this.description = description; return this; }
        setDate(date: EventDate): this { this.date = date; return this; }
        setLocation(location: Venue): this { this.location = location; return this; }
        setPrice(price: EventPrice): this { this.price = price; return this; }
        setPhotoUrl(url: EventPhotoUrl): this { this.photoUrl = url; return this; }
        setCategoryId(categoryId: number | null | undefined): this { // Added setter
            this.categoryId = categoryId;
            return this;
        }


        build(): Event {
            if (
                this.id == null || !this.name || !this.description || !this.date || !this.location ||
                !this.price || !this.photoUrl
                // categoryId can be optional
            ) {
                throw new Error("Missing required fields for Event.");
            }
            return new Event(
                this.id, this.name, this.description, this.date, this.location,
                this.price, this.photoUrl, this.categoryId
            );
        }
    }
}