import IEventRepository from "@src/domain/event/interfaces/IEventRepository";
import { inject, injectable } from 'inversify';
import { TYPES } from '@src/config/types';
@injectable()
export default class EventRepository implements IEventRepository {
    constructor(){
        
    }
    async reassignEventsCategory(oldCategoryId: number, newCategoryId: number): Promise<void> {
        console.log("reassignEventsCategory called with oldCategoryId: " + oldCategoryId + " and newCategoryId: " + newCategoryId);
        
    }

}