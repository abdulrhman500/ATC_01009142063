export default class EmailException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EmailException';
    }
}