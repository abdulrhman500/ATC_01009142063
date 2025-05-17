import CategoryName from "@domain/category/value-objects/CategoryName"
import { Type } from "class-transformer";

export default class Category {
    public readonly id: number | null
    @Type(() => CategoryName)
    public readonly name: CategoryName
    public readonly parentId: number | null
    public readonly children: Category[]; 

    constructor(id: number|null, name: CategoryName, parentId: number|null, children: Category[]= []) {
        this.id = id;
        this.name = name;
        this.parentId = parentId;
        this.children = children;
    }

  
    public getId(): number|null {
        return this.id;
    }

    public getName(): CategoryName {
        return this.name;
    }

    public getParentId(): number|null {
        return this.parentId;
    }
    public getChildren(): Category[] {
        return this.children;
    }
    

}