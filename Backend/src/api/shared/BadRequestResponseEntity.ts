import ResponseEntity from "@api/shared/ResponseEntity";
import { ReasonPhrases, StatusCodes } from "http-status-codes";


export default class BadRequestResponseEntity extends ResponseEntity<any> {
    constructor(message: string = ReasonPhrases.BAD_REQUEST) {
        super(StatusCodes.BAD_REQUEST, message, {});
    }
}