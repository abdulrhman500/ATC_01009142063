import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export default class CreateCategoryRequestDto {
    
    @IsNotEmpty({ message: "category name is required" })
    
    @IsString()
    
    @Transform(({ value }: { value: string }) => value.trim())
    public name: string;

    // @IsNotEmpty({ message: "Parent category  is required" })
    @IsOptional()
    public parentCategoryId: number|null;

    constructor(name: string, parentId: number) {
        this.name = name;
        this.parentCategoryId = parentId;
    }


}