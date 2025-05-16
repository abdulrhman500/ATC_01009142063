import { ClassTransformOptions, instanceToPlain } from "class-transformer";

export default class ResponseEntity<T> {
    private statusCode: number;
    private message: string
    private payload: T;

    constructor(statusCode: number, message: string, dto: T) {
        this.statusCode = statusCode;
        this.message = message;
        this.payload = dto;
    }

    getpayload(): T {
        return this.payload;
    }

    getMessage(): string {
        return this.message;
    }

    getStatus(): number {
        return this.statusCode;

    }

        /**
     * Converts this ResponseEntity instance to a plain JavaScript object.
     * If the 'payload' is a class instance or contains class instances,
     * it will also be deeply converted to its plain object representation
     * using class-transformer's instanceToPlain.
     *
     * @param payloadTransformOptions Optional ClassTransformOptions to pass to instanceToPlain
     * for transforming the 'payload'. This allows you to control
     * aspects like which groups are exposed in the payload.
     * @returns A plain object representation of this ResponseEntity.
     */
        public toPlainObject(payloadTransformOptions?: ClassTransformOptions): Record<string, any> {
            return {
                statusCode: this.statusCode,
                message: this.message,
                // Apply instanceToPlain to the payload to ensure deep conversion.
                // If 'this.payload' is already a primitive or plain literal object,
                // instanceToPlain will generally handle it correctly (e.g., return it as is).
                payload: instanceToPlain(this.payload, payloadTransformOptions)
            };
        }
    
        /**
         * This is a special method name that JSON.stringify() will automatically
         * call if it exists on an object. This ensures that when you run
         * JSON.stringify(responseEntityInstance), you get the desired plain object
         * structure with a deeply plainified payload (using default transform options for the payload).
         */
        public toJSON(): Record<string, any> {
            // For JSON.stringify, we'll use the default transformation for the payload.
            // If specific options are needed for JSON.stringify output,
            // you might consider how those options are globally configured or
            // if ResponseEntity itself needs @Expose decorators and its own
            // instanceToPlain(this, options) call. But typically, toJSON just defines the structure.
            return {
                statusCode: this.statusCode,
                message: this.message,
                payload: instanceToPlain(this.payload) // Uses default options for payload
            };
        }
    
}
