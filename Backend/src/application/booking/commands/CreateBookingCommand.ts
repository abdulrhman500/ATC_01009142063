export default class CreateCategoryCommand{
    public eventId: string | number ;
     public userId: number | string;

    constructor(eventId: string, userId: number) {
        this.eventId = eventId;
        this.userId = userId;
    }

    public getEventId(): string | number {
        return this.eventId;
    }

    public getUserId(): string | number {
        return this.userId;
    }

}