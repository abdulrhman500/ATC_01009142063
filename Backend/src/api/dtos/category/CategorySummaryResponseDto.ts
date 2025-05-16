import { Expose, Transform, Type } from 'class-transformer';
import Category from '@src/domain/category/Category';
export  default class CategorySummaryResponseDto {
    @Expose()
    @Transform(({ obj }: { obj: Category }) => obj.getId() !== null ? String(obj.getId()) : null)
    id!: string | null; // Or string if ID is guaranteed non-null

    @Expose()
    @Transform(({ obj }: { obj: Category }) => obj.getName().getValue())
    name!: string;

    @Expose()
    @Transform(({ obj }: { obj: Category }) => obj.getParentId() !== null ? String(obj.getParentId()) : null)
    parentId!: string | null;
}