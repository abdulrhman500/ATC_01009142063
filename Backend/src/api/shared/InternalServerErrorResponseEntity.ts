import ResponseEntity from "@api/shared/ResponseEntity";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

 class InternalServerErrorResponseEntity extends ResponseEntity<any> {
    constructor(body: any = {}) {
        super(StatusCodes.INTERNAL_SERVER_ERROR, ReasonPhrases.INTERNAL_SERVER_ERROR, body);
    }
}


export default InternalServerErrorResponseEntity;