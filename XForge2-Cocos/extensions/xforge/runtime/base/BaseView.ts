import { _decorator, Component, Enum, error, js } from 'cc';
import { EventBus } from '../core/EventBus';
import { Logger } from '../lib/Logger';
import { BaseModule } from './BaseModule';
const { ccclass, property } = _decorator;

enum ViewHideMode {
    /**销毁(更省内存) */
    Destroy,
    /**隐藏(速度更快但对Page无效) */
    Active,
}

const Group = { id: 'BaseView', name: 'Settings', displayOrder: -Infinity, style: 'section' };

export type BaseViewType = typeof BaseView;

@ccclass('BaseView')
export class BaseView extends Component {
    public static ViewHideMode = ViewHideMode;

    @property
    private _hideMode = ViewHideMode.Destroy;
    @property({
        group: Group,
        type: Enum(ViewHideMode),
        tooltip: '关闭模式: Destroy表示销毁(更省内存) Active表示隐藏(速度更快但对Page无效)',
    })
    public get hideMode() {
        return this._hideMode;
    }
    public set hideMode(value) {
        this._hideMode = value;
    }

    @property
    private _shadow = true;
    @property({
        group: Group,
        tooltip: '是否需要底层遮罩(对Page无效)',
        visible(this: BaseView) {
            return true;
        }
    })
    public get shadow() {
        return this._shadow;
    }
    protected set shadow(value) {
        if (value) {
            if (this.viewName.indexOf('Page') == 0) {
                this.log('shadow属性对Page无效');
            }
        }
        this._shadow = value;
    }

    // 类名
    private _base_view_name = js.getClassName(this);
    public get viewName() {
        return this._base_view_name;
    }

    // 事件
    private _base_event = new EventBus();

    // 模块
    private static _module: BaseModule;
    /** 
     * 当前所在模块(在onLoad中不可用)
     */
    public get module() {
        return (this.constructor as typeof BaseView)._module;
    }

    /**
     * 显示前逻辑（内部调用）
     * @description 生命周期顺序: beforeShow -> onLoad -> onShow -> start
     */
    public static innerBeforeShow(module: BaseModule, type: BaseViewType, data: any): Promise<void> {
        Logger.create('log', '#4682b4', `[${js.getClassName(type)}] LOG`)('beforeShow');
        type._module = module;
        return type.beforeShow(module, data);
    }

    /**
     * [可重写] 显示前逻辑
     * @description 生命周期顺序: beforeShow -> onLoad -> onShow -> start
     */
    protected static beforeShow(module: BaseModule, data: any): Promise<void> {
        return Promise.resolve();
    }

    /**
     * show流程（内部调用）
     */
    public static innerShow(
        view: BaseView,
        data: any = null,
        onHide: ((data: any) => void) | null = null
    ) {
        // 注册onHide事件
        view._base_event.once('onHide', onHide);

        // 触发onShow
        view.log('onShow');
        view.onShow(data);
    }

    /**
     * [可重写] 显示逻辑
     * @description 生命周期顺序: beforeShow -> onLoad -> onShow -> start
     */
    protected onShow(data: any): void {

    }

    /**
     * hide流程（内部调用）
     */
    public static innerHide(view: BaseView, onHide: ((data: any) => void) | null = null): boolean {
        try {
            view.beforeHide();
        } catch (err) {
            view.error(err as string);
            return false;
        }

        const result = view.onHide();

        try {
            // 先触发onShow中注册的回调
            view._base_event.emit('onHide', result);
            // 再触发参数中的回调
            onHide?.(result);
        } catch (err) {
            error(err);
        }
        return true;
    }

    // [可重写] 隐藏前逻辑(抛出错误可打断hide流程)
    protected beforeHide(): void {

    }
    // [可重写] 隐藏逻辑
    protected onHide(): any {
        return null;
    }

    public resetInEditor() {
        this.hideMode = ViewHideMode.Destroy;
        this.shadow = (this.viewName.indexOf('Page') != 0 && this.viewName.indexOf('Paper') != 0);
    }

    /** 打印日志 */
    protected get log(): Function {
        return Logger.create('log', '#4682b4', `[${this.viewName}] LOG`);
    }
    /** 打印警告 */
    protected get warn(): Function {
        return Logger.create('warn', '#ff7f50', `[${this.viewName}] WARN`);
    }
    /** 打印错误 */
    protected get error(): Function {
        return Logger.create('error', '#ff4757', `[${this.viewName}] ERROR`);
    }
}