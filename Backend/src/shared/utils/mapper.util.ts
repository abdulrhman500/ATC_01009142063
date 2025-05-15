import { plainToInstance, ClassConstructor } from 'class-transformer';

/**
 * Maps a source object or class instance to a target DTO class instance.
 * Useful for transforming domain entities or request payloads into response DTOs.
 * @param dtoClass The target DTO class constructor.
 * @param sourceObject The source object or class instance to transform.
 * @param options Additional class-transformer options.
 * @returns An instance of the target DTO class.
 */
export function mapToDto<T>(
    dtoClass: ClassConstructor<T>,
    sourceObject: any,
    options?: { excludeExtraneousValues?: boolean; groups?: string[] }
): T {
    // Use plainToInstance. Passing { excludeExtraneousValues: true }
    // ensures only properties with @Expose() on the dtoClass are included.
    return plainToInstance(dtoClass, sourceObject, {
        excludeExtraneousValues: true, // Recommended for DTOs
        ...options,
    });
}

// You could add other mapping helpers here, e.g., for arrays
export function mapToDtoArray<T>(
    dtoClass: ClassConstructor<T>,
    sourceArray: any[],
    options?: { excludeExtraneousValues?: boolean; groups?: string[] }
): T[] {
     return plainToInstance(dtoClass, sourceArray, {
        excludeExtraneousValues: true,
        ...options,
    });
}