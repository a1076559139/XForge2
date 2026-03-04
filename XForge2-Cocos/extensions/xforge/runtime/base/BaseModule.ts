import { Asset, js } from 'cc';
import { loader } from '../lib/Loader';
import { task } from '../lib/Task';
import { SoundManager } from '../mgr/sound/SoundManager';
import { UIManager } from '../mgr/ui/UIManager';
import { AppGlobalUtility, AppModuleUtility } from '../utillity/Utillity';
import { BaseModel, BaseModelType } from './BaseModel';
import { BaseService, BaseServiceType } from './BaseService';

interface Action<T = void> {
    (result: T): void;
}

export interface IModelContext {
    readonly moduleName: string;
    readonly isGlobal: boolean;
    useModel<T extends BaseModelType>(type: T): InstanceType<T>;
}

export interface IServiceContext {
    readonly moduleName: string;
    readonly isGlobal: boolean;
    readonly sound: SoundManager;
    useModel<T extends BaseModelType>(type: T): InstanceType<T>;
    useService<T extends BaseServiceType>(type: T): InstanceType<T>;
    loadAsset<T extends typeof Asset>(path: string, type: T, onCompleted: Action<InstanceType<T> | null>, onProgress?: Action<number>): void;
}

const moduleTypeMap = new Map<string, { new(): BaseModule }>();
export function getModuleType(moduleName: string): { new(): BaseModule } {
    return moduleTypeMap.get(moduleName);
}

export function getGlobalType(): { new(): BaseModule } {
    return moduleTypeMap.get(AppGlobalUtility.getModuleTypeName());
}

/**
 * 模块装饰器
 */
export function module(moduleName: string) {
    return function fNOP(ctor: any) {
        ctor._isGlobal = false;
        ctor._moduleName = moduleName;
        if (js.isChildClassOf(ctor, BaseModule)) {
            moduleTypeMap.set(AppModuleUtility.getModuleTypeName(moduleName), ctor);
        }
        return ctor;
    };
}
/**
 * 全局模块装饰器
 */
export function global() {
    return function fNOP(ctor: any) {
        ctor._isGlobal = true;
        ctor._moduleName = 'Global';
        if (js.isChildClassOf(ctor, BaseModule)) {
            moduleTypeMap.set(AppGlobalUtility.getModuleTypeName(), ctor);
        }
        return ctor;
    };
}

export abstract class BaseModule implements IModelContext, IServiceContext {
    // 有@module或@global赋值
    private static _isGlobal = false;
    private static _moduleName = '';

    /**
     * 获取module名字
     */
    public get moduleName() {
        return (this.constructor as typeof BaseModule)._moduleName;
    }
    /**
     * 是否是全局模块
     */
    public get isGlobal(): boolean {
        return (this.constructor as typeof BaseModule)._isGlobal;
    }

    public static load(module: BaseModule, onLoaded: Action = null, onError: Action = null, onProgress: Action<number> = null) {
        task.createSync()
            .add(next => {
                const bundleName = module.isGlobal
                    ? AppGlobalUtility.getAssetBundleName()
                    : AppModuleUtility.getAssetBundleName(module.moduleName);

                loader.loadBundle({
                    bundle: bundleName,
                    onComplete: (bundle) => {
                        if (bundle) {
                            next();
                        } else {
                            onError();
                        }
                    }
                });
            })
            .add(next => {
                module.init(next, onError, (progress) => {
                    onProgress?.(progress);
                });
            })
            .start(() => {
                module.onLoad();
                onLoaded?.();
            });
    }

    public static unload(module: BaseModule) {
        module.onUnload();
        // 释放UIManager中的缓存
        module.ui.release();
        // 释放SoundManager中的缓存
        module.sound.release();

        if (module.isGlobal) {
            loader.unloadBundle(AppGlobalUtility.getAssetBundleName());
        } else {
            loader.unloadBundle(AppModuleUtility.getAssetBundleName(module.moduleName));
        }
    }

    /**
     * 加载AssetBundle目录下的资源
     * @param path 
     * @param type 
     * @param onCompleted 
     * @param onProgress 
     */
    public loadAsset<T extends typeof Asset>(path: string, type: T, onCompleted: Action<InstanceType<T> | null>, onProgress?: Action<number>): void {
        if (this.isGlobal) {
            loader.loadAsset({
                path: path,
                type: type,
                bundle: AppGlobalUtility.getAssetBundleName(),
                onComplete: onCompleted,
                onProgress: onProgress,
            });
        } else {
            loader.loadAsset({
                path: path,
                type: type,
                bundle: AppModuleUtility.getAssetBundleName(this.moduleName),
                onComplete: onCompleted,
                onProgress: onProgress,
            });
        }
    }

    // ### Model ###
    private readonly modelCacheMap = new Map<BaseModelType, BaseModel>();

    public useModel<T extends BaseModelType>(type: T): InstanceType<T> {
        if (this.modelCacheMap.has(type)) {
            return this.modelCacheMap.get(type) as InstanceType<T>;
        }

        const model = new type(this) as InstanceType<T>;
        this.modelCacheMap.set(type, model);
        return model;
    }
    public removeModel(type: BaseModelType): void {
        if (this.modelCacheMap.has(type)) {
            this.modelCacheMap.delete(type);
        }
    }
    // ###END###

    // ### Service ###
    private readonly serviceCacheMap = new Map<BaseServiceType, BaseService>();

    public useService<T extends BaseServiceType>(type: T): InstanceType<T> {
        if (this.serviceCacheMap.has(type)) {
            return this.serviceCacheMap.get(type) as InstanceType<T>;
        }

        const service = new type(this) as InstanceType<T>;
        this.serviceCacheMap.set(type, service);
        return service;
    }
    public removeService(type: BaseServiceType): void {
        if (this.serviceCacheMap.has(type)) {
            this.serviceCacheMap.delete(type);
        }
    }
    // ###END###

    // ### Manager ###
    private _ui: UIManager;
    public get ui() {
        if (this._ui) {
            return this._ui;
        }
        this._ui = new UIManager(this);
        return this._ui;
    }

    private _sound: SoundManager;
    public get sound() {
        if (this._sound) {
            return this._sound;
        }
        this._sound = new SoundManager(this);
        return this._sound;
    }
    // ###END###

    /**
     * 初始化
     * @param onLoaded 加载完成回调函数
     * @param onLoaded 加载失败回调函数
     * @param onProgress 加载进度回调函数
     */
    protected init(onLoaded: Action, onError: Action, onProgress: Action<number>): void {
        onError;
        onProgress;
        onLoaded();
    }

    /**
     * 加载完成后
     */
    protected onLoad() {

    }

    /**
     * 卸载完成后
     */
    protected onUnload() {

    }
}