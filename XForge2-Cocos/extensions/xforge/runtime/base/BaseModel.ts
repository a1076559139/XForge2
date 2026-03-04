import { IModelContext } from './BaseModule';

export type BaseModelType = new (module: IModelContext) => BaseModel;

export abstract class BaseModel {
    private readonly _module: IModelContext;
    public get module() {
        return this._module;
    }
    public constructor(module: IModelContext) {
        this._module = module;
    }
}