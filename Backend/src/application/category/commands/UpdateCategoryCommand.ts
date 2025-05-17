export default class UpdateCategoryCommand {
    constructor(
        public readonly id: number,
        public readonly name?: string ,         // Undefined if not to be updated
        public readonly parentId?: number | null // Undefined if not to be updated; null means set to root
    ) {}
}