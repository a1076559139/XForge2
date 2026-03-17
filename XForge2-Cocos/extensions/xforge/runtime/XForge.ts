import { js } from 'cc';
import { DEBUG, DEV, EDITOR } from 'cc/env';
import { BaseModule, getGlobalType, getModuleType } from './base/BaseModule';
import { EventBus } from './core/EventBus';
import * as debug from './lib/Debug';
import { loader } from './lib/Loader';
import { logger } from './lib/Logger';
import { storage } from './lib/Storage';
import { task } from './lib/Task';
import { AppGlobalUtility, AppModuleUtility } from './utillity/Utillity';

interface Action<T = void> {
    (result: T): void;
}

export class App {
    private static _inst: App;
    public static get inst() {
        if (this._inst)
            return this._inst;

        this._inst = new this();
        return this._inst;
    }

    private constructor() {
        if (!EDITOR || DEV) {
            if (!js.getClassById('App')) {
                js.setClassAlias(App as any, 'App');
            }
        }
    }

    /**
     * 业务逻辑中**禁止**使用。
     * - 仅在与外部环境交互时使用，比如在Web环境中与Vue进行通信。
     */
    public readonly event = new EventBus();

    public lib = { task, storage, debug, logger, loader };

    // ### Global ###
    private _global: BaseModule;
    public get global(): BaseModule {
        return this._global;
    }

    public loadGlobal(params: {
        onLoaded?: () => void,
        onError?: () => void,
        onProgress?: (progress: number) => void
    }) {
        if (this._global != null) {
            // 保证一定是异步的
            setTimeout(() => {
                params.onLoaded?.();
            });
        }
        else {
            const asmName = AppGlobalUtility.getAssemblyName();
            app.lib.loader.loadBundle({
                bundle: asmName,
                onComplete: (bundle) => {
                    if (bundle) {
                        const type = getGlobalType();
                        this._global = new type();
                        BaseModule.load(this._global, params.onLoaded, params.onError, params.onProgress);
                    } else {
                        console.error(`程序集加载失败: ${asmName}`);
                        params.onError?.();
                    }
                },
            });
        }
    }

    public unloadGlobal() {
        BaseModule.unload(this._global);
        this._global = null;
    }
    // ###END###

    // ### Module ###
    private readonly _moduleCacheMap = new Map<string, BaseModule>();
    public loadModule(params: {
        name: string,
        onLoaded?: () => void,
        onError?: () => void,
        onProgress?: (progress: number) => void
    }) {
        if (this._moduleCacheMap.has(params.name)) {
            // 保证一定是异步的
            setTimeout(() => {
                params.onLoaded?.();
            });
        }
        else {
            const asmName = AppModuleUtility.getAssemblyName(params.name);
            const typeName = AppModuleUtility.getModuleTypeName(params.name);
            app.lib.loader.loadBundle({
                bundle: asmName,
                onComplete: (bundle) => {
                    if (bundle) {
                        const type = getModuleType(typeName);
                        const module = new type();
                        this._moduleCacheMap.set(params.name, module);
                        BaseModule.load(module, params.onLoaded, params.onError, params.onProgress);
                    } else {
                        console.error(`程序集加载失败: ${asmName}`);
                        params.onLoaded?.();
                    }
                },
            });
        }
    }

    public unloadModule(name: string) {
        if (this._moduleCacheMap.has(name)) {
            let module = this._moduleCacheMap.get(name);
            this._moduleCacheMap.delete(name);
            BaseModule.unload(module);
        }
    }

    public unloadAllModules() {
        this._moduleCacheMap.forEach(module => {
            BaseModule.unload(module);
        });

        this._moduleCacheMap.clear();
    }
    // ###END###
}

export const app = App.inst;

if (DEV || DEBUG) {
    //@ts-ignore
    window['app'] = app;
}