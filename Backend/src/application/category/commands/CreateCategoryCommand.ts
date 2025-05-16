export default class CreateCategoryCommand{
    private _name: string;
    private _parentId: number;

    constructor(name: string, parentId: number) {
        this._name = name;
        this._parentId = parentId;
    }

    public getName(): string {
        return this._name;
    }

    public getParentId(): number {
        return this._parentId;
    }

}