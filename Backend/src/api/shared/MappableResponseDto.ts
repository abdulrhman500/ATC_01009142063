export default class MappableResponseDto {
    /**
     * This base static factory method is intended to be overridden by subclasses.
     * If a subclass does not provide its own `toDtoFrom` implementation,
     * calling this method on that subclass will result in a runtime error,
     * reminding the developer to implement the specific mapping logic.
     *
     * @param _source - The source object (e.g., a domain entity). The underscore
     * indicates it's not used in this base implementation.
     * @returns This method always throws an error.
     * @throws Error indicating that `toDtoFrom` must be implemented by the subclass.
     */
    public static toDtoFrom(..._source: any): any {
        // `this.name` will refer to the name of the class on which this static method was called
        // (e.g., "CreateCategoryResponseDto" if it inherited and didn't override).
        throw new Error(
            `The static method 'toDtoFrom(source)' must be implemented by the DTO class '${this.name}'. ` +
            "It was called on the base IMappableResponseDto or on a subclass that did not provide its own implementation."
        );
    }
}