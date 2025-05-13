export default class ResponseEntity<T> {
    private statusCode: number;
    private message: string
    private body: T;

    constructor(statusCode: number, message: string, dto: T) {
        this.statusCode = statusCode;
        this.message = message;
        this.body = dto;
    }

    getBody(): T {
        return this.body;
    }

    getMessage(): string {
        return this.message;
    }

    getStatus(): number {
        return this.statusCode;

    }

}
