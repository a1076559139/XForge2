import { Logger } from '../lib/Logger';
import { BaseModule } from './BaseModule';

export type BaseManagerType = new (...args: any[]) => BaseManager;

export abstract class BaseManager {

    private readonly _module: BaseModule;
    public get module() {
        return this._module;
    }
    public constructor(module: BaseModule) {
        this._module = module;
    }

    /**打印日志 */
    protected get log(): Function {
        return Logger.create('log', '#4682b4', `[${this['constructor'].name}] LOG`);
    }
    /**打印警告 */
    protected get warn(): Function {
        return Logger.create('warn', '#ff7f50', `[${this['constructor'].name}] WARN`);
    }
    /**打印错误 */
    protected get error(): Function {
        return Logger.create('error', '#ff4757', `[${this['constructor'].name}] ERROR`);
    }
}