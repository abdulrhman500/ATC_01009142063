import { Expose, Transform } from 'class-transformer';
import Category from '@domain/category/Category'; 
import CategoryName from '@domain/category/value-objects/CategoryName';

export default class CreateCategoryResponseDto {
    @Expose()
    @Transform(({ obj }: { obj: Category }) => {
        const id = obj.getId();
        return id !== null ? String(id) : null;
    })
    id!: string | null;

    @Expose()
    @Transform(({ obj }: { obj: Category }) => obj.getName().getValue()) 

    @Expose()
    @Transform(({ obj }: { obj: Category }) => {
        const parentId = obj.getParentId(); // returns number | null
        return parentId !== null ? String(parentId) : null;
    })
    parentId!: string | null;
}