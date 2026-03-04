import { MessageBus } from '../core/MessageBus';
import { IServiceContext } from './BaseModule';

export type BaseServiceType = new (module: IServiceContext) => BaseService;

export abstract class BaseService {
    private readonly _module: IServiceContext;
    public get module() {
        return this._module;
    }
    public constructor(module: IServiceContext) {
        this._module = module;
    }

    public readonly event = new MessageBus();
}