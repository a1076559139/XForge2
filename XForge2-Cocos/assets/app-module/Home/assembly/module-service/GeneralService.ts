import { BaseService } from 'db://xforge/base/BaseService';
import { MessageBus } from 'db://xforge/core/MessageBus';

export class GeneralEvent implements MessageBus.IEvent {
    constructor(
        public name: string,
        public age: number
    ) { }
}

export class GeneralService extends BaseService {

}