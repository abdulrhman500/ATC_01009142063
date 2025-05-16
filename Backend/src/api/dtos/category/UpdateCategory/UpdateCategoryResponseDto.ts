import { Expose, Transform } from 'class-transformer';
import Category from '@domain/category/Category';

export default class UpdateCategoryResponseDto {
    @Expose()
    @Transform(({ obj }: { obj: Category }) => {
        const id = obj.getId(); // Will be a number
        return String(id);      // Transform to string
    })
    id!: string;

    @Expose()
    @Transform(({ obj }: { obj: Category }) => obj.getName().getValue())
    name!: string;

    @Expose()
    @Transform(({ obj }: { obj: Category }) => {
        const parentId = obj.getParentId(); // number | null
        return parentId !== null ? String(parentId) : null;
    })
    parentId!: string | null;
}