import CategoryName from "@domain/category/value-objects/CategoryName"

export default class Category {
    id: number
    name: CategoryName
    parentId: number

    constructor(id: number, name: CategoryName, parentId: number) {
        this.id = id;
        this.name = name;
        this.parentId = parentId;
    }
    
    //getters
    public getId(): number {
        return this.id;
    }

    public getName(): CategoryName {
        return this.name;
    }

    public getParentId(): number {
        return this.parentId;
    }

}