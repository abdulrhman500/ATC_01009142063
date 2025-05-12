
import UserId from "@value-objects/user/UserId";
import EventName from "@value-objects/events/EventName";
import EventDescription from "./value-objects/events/EventDescription";
import EventDate from "./value-objects/events/EventDate";
import EventLocation from "./value-objects/events/EventLocation";


/**
 * Event class representing an event in the system.
 * @class
 */

export default class Event {
    readonly id: number;
    readonly name: EventName;
    readonly description: EventDescription;
    readonly date: EventDate;
    readonly location: EventLocation;
    readonly createdAt: Date;
    readonly lastupdatedAt: Date;
    readonly createdBy: UserId;
    readonly updatedBy: UserId;

    constructor(id: number, name: EventName, description: EventDescription, date: EventDate, location: EventLocation, createdBy: UserId, createdAt: Date, updatedBy: UserId, lastupdatedAt: Date) {


        this.id = id;
        this.name = name;
        this.description = description;
        this.date = date;
        this.location = location;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedBy = updatedBy;
        this.lastupdatedAt = lastupdatedAt;
    }


    public static Builder = class EventBuilder {
        private id: number | undefined;
        private name: EventName | undefined;
        private description: EventDescription | undefined;
        private date: EventDate | undefined;
        private location: EventLocation | undefined;
        private createdAt: Date | undefined;
        private lastupdatedAt: Date | undefined;
        private createdBy: UserId | undefined;
        private updatedBy: UserId | undefined;

        setId(id: number): EventBuilder { this.id = id; return this; }
        setName(name: EventName): EventBuilder { this.name = name; return this; }
        setDescription(description: EventDescription): EventBuilder { this.description = description; return this; }
        setDate(date: EventDate): EventBuilder { this.date = date; return this; }
        setLocation(location: EventLocation): EventBuilder { this.location = location; return this; }
        setCreatedAt(date: Date): EventBuilder { this.createdAt = date; return this; }
        setCreatedBy(userId: UserId): EventBuilder { this.createdBy = userId; return this; }
        setUpdatedAt(date: Date): EventBuilder { this.lastupdatedAt = date; return this; }
        setUpdatedBy(userId: UserId): EventBuilder { this.updatedBy = userId; return this; }

        build(): Event {
            if (this.id == null || !this.name || !this.description || !this.date || !this.location || this.createdAt == null || this.createdBy == null || this.updatedBy == null || this.lastupdatedAt == null) {
                throw new Error("EventBuilder requires id, name, description, date, location, createdAt, createdBy, updatedBy, and lastupdatedAt.");
            }
            // the builder is used to make the build process easier
            // and to make the code more readable

            return new Event(
                this.id,
                this.name,
                this.description ?? new EventDescription("Default Description"),
                this.date,
                this.location,
                this.createdBy,
                this.createdAt,
                this.updatedBy,
                this.lastupdatedAt
            );

        }
    }
}