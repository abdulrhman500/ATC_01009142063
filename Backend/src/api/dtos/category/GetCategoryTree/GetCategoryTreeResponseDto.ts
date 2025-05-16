import { Expose, Type } from 'class-transformer';
export class CategoryTreeNodeDto {
    @Expose()
    id!: string | null; 

    @Expose()
    name!: string;

    @Expose()
    parentId!: string | null; 

    @Expose()
    @Type(() => CategoryTreeNodeDto)
    children!: CategoryTreeNodeDto[];
}

export default class GetCategoryTreeResponseDto {
    @Expose()
    @Type(() => CategoryTreeNodeDto) // Tells class-transformer that 'data' is an array of CategoryTreeNodeDto instances
    data: CategoryTreeNodeDto[];

    constructor(data: CategoryTreeNodeDto[]) {
        this.data = data;
    }
}