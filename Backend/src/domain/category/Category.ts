import CategoryName from "@domain/category/value-objects/CategoryName"

export default class Category {
    public readonly id: number | null
    public readonly name: CategoryName
    public readonly parentId: number | null

    constructor(id: number|null, name: CategoryName, parentId: number|null) {
        this.id = id;
        this.name = name;
        this.parentId = parentId;
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
    

}