import {CreateCategoryCommand} from "@api/category/application/CreateCategoryCommand";
export default class CategoryHandler {

    createCategory(command: CreateCategoryCommand): Category {
    const name = new CategoryName(command.getName(), command);
    const parentId = command.getParentId();
    const id = this.generateUniqueId();
}
}