export default class GetAllCategoriesQuery {
    constructor(
        public readonly page: number,
        public readonly limit: number
     
    ) {}
}