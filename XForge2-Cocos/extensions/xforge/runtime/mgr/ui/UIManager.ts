import { director, Event, instantiate, isValid, js, Layers, log, Node, Prefab, ResolutionPolicy, SceneAsset, screen, Settings, settings, size, view, warn } from 'cc';
import { DEBUG, DEV } from 'cc/env';
import { Configuration } from '../../base/BaseMain';
import { BaseManager } from '../../base/BaseManager';
import { BaseModule } from '../../base/BaseModule';
import { BaseView, BaseViewType } from '../../base/BaseView';
import { createUUID } from '../../utillity/Utillity';
import UILoading from './UILoading';
import UIShadow from './UIShadow';
import UIToast from './UIToast';

export const ViewType = {
    Page: 'Page',
    Paper: 'Paper',
    Pop: 'Pop',
    Top: 'Top'
};

export enum ViewState {
    None,
    Loading,
    Showing,
    Hiding
}

// 获取UI类型，返回值首字母大写
function getViewTypeName(viewName: string): string {
    if (viewName.startsWith(ViewType.Page)) {
        return ViewType.Page;
    }
    if (viewName.startsWith(ViewType.Paper)) {
        return ViewType.Paper;
    }
    if (viewName.startsWith(ViewType.Pop)) {
        return ViewType.Pop;
    }
    if (viewName.startsWith(ViewType.Top)) {
        return ViewType.Top;
    }
    return '';
}

const BlockEvents = [
    Node.EventType.TOUCH_START, Node.EventType.TOUCH_MOVE, Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL,
    Node.EventType.MOUSE_DOWN, Node.EventType.MOUSE_MOVE, Node.EventType.MOUSE_UP,
    Node.EventType.MOUSE_ENTER, Node.EventType.MOUSE_LEAVE, Node.EventType.MOUSE_WHEEL
];

class ShowCommand {
    public viewType: BaseViewType;
    public data: any;
    public onShow: () => void;
    public onHide: (data: any) => void;
    public onError: () => void;
    public onProgress: (progress: number) => void;
}

class ViewInfo {
    public viewState = ViewState.None;
    public viewComp: BaseView = null;
    public moduleName: string = '';

    public constructor(moduleName: string) {
        this.moduleName = moduleName;
    }

    public clear(): void {
        if (isValid(this.viewComp)) {
            this.viewComp.node.destroy();
        }
        this.viewState = ViewState.None;
        this.viewComp = null;
        this.moduleName = '';
    }
}

export class UIManager extends BaseManager {
    public static ViewType = ViewType;
    public static ViewState = ViewState;
    public static ViewInfo = ViewInfo;

    /**
     * 自动分辨率适配策略
     * - 开启后会弃用当前的适配策略，并根据实际设备分辨率与设计分辨率的比值，计算出新的适配策略(宽适配或高适配)，保证游戏区域不会被裁减只会扩边
     *   - 当实际设备分辨率「高/宽」>= 设计分辨率「高/宽」时，为宽适配
     *   - 当实际设备分辨率「高/宽」< 设计分辨率「高/宽」时，为高适配
     */
    public static useAutoResolutionFit() {
        // 自动适配分辨率策略
        const designResolution = settings.querySettings(Settings.Category.SCREEN, 'designResolution') as { width: number, height: number, policy: number };
        const windowSize = size(screen.windowSize);
        let resolutionPolicy = designResolution.policy;
        const autoFitResolutionPolicy = function () {
            if (windowSize.width / windowSize.height > designResolution.width / designResolution.height) {
                if (resolutionPolicy === ResolutionPolicy.FIXED_HEIGHT) return;
                view.setResolutionPolicy(ResolutionPolicy.FIXED_HEIGHT);
                resolutionPolicy = ResolutionPolicy.FIXED_HEIGHT;
            } else {
                if (resolutionPolicy === ResolutionPolicy.FIXED_WIDTH) return;
                view.setResolutionPolicy(ResolutionPolicy.FIXED_WIDTH);
                resolutionPolicy = ResolutionPolicy.FIXED_WIDTH;
            }
        };
        autoFitResolutionPolicy();
        setInterval(() => {
            if (windowSize.equals(screen.windowSize)) return;
            windowSize.set(screen.windowSize);
            autoFitResolutionPolicy();
        }, 500);
    }

    ////////////////////////// shadow //////////////////////////
    private static _shadow: Node;
    public static get shadow(): Node {
        if (!this._shadow) {
            this._shadow = instantiate(Configuration.UIShadow);
            this._shadow.parent = Configuration.UserInterface;
            this._shadow.layer = Layers.Enum.UI_2D;
            this._shadow.active = false;
        }
        return this._shadow;
    }
    /**
     * 获取一个节点上的BaseView组件, 获取不到返回null
     */
    private static getBaseView(node: Node): BaseView {
        if (!node) return null;
        return node.components.find(component => component instanceof BaseView) as BaseView;
    }
    /**
     * 更新阴影的层级及显示
     */
    public static refreshShadow() {
        // 倒序遍历uiRoots
        const uiRoots = Configuration.UserInterface.children;
        for (let index = uiRoots.length - 1; index >= 0; index--) {
            const uiRoot = uiRoots[index];
            if (uiRoot.name === ViewType.Paper || uiRoot.name === ViewType.Pop || uiRoot.name === ViewType.Top) {
                // 倒序遍历uiRoot
                const children = uiRoot.children;
                for (let i = children.length - 1; i >= 0; i--) {
                    const node = children[i];
                    if (node === this.shadow) continue;

                    const view = this.getBaseView(node);
                    if (!view) continue;
                    if (!view.module) continue;
                    if (!view.module.ui.isShowing(view)) continue;

                    // 添加遮罩
                    if (view.shadow) {
                        this.shadow.getComponent(UIShadow).init();
                        this.shadow.layer = node.layer;
                        this.shadow.parent = uiRoot;
                        this.shadow.active = true;

                        let shadowIndex = this.shadow.getSiblingIndex();
                        let nodeIndex = node.getSiblingIndex();
                        if (shadowIndex > nodeIndex) {
                            this.shadow.setSiblingIndex(nodeIndex);
                        } else {
                            this.shadow.setSiblingIndex(nodeIndex - 1);
                        }
                        return;
                    }
                }
            }
        }

        this.shadow.active = false;
        this.shadow.getComponent(UIShadow).clear();
    }

    ////////////////////////// loading //////////////////////////
    private static _loading: Node;
    public static get loading(): Node {
        if (!this._loading) {
            this._loading = instantiate(Configuration.UILoading);
            this._loading.parent = Configuration.UserInterface;
            this._loading.layer = Layers.Enum.UI_2D;
            this._loading.setSiblingIndex(3);
            this._loading.active = false;
        }
        return this._loading;
    }
    // 记录展示加载
    private static loadingMap = new Map<number, boolean>();
    /**
     * 添加loading
     * @param timeout 毫秒
     */
    public static addLoading(timeout = 0) {
        UIManager.loading.active = true;
        UIManager.loading.setSiblingIndex(-1);
        UIManager.loading.getComponent(UILoading).init();
        const uuid = createUUID();
        this.loadingMap.set(uuid, true);
        if (timeout > 0) setTimeout(() => {
            this.removeLoading(uuid);
        }, timeout);
        return uuid;
    }
    /**
     * 移除loading
     * @param uuid showLoading的返回值
     * @returns 
     */
    public static removeLoading(uuid: number) {
        if (!uuid) return;
        this.loadingMap.delete(uuid);
        if (this.loadingMap.size === 0) {
            UIManager.loading.getComponent(UILoading).clear();
            UIManager.loading.active = false;
        }
    }

    ////////////////////////// toast //////////////////////////
    private static _toast: Node;
    public static get toast(): Node {
        if (!this._toast) {
            this._toast = instantiate(Configuration.UIToast);
            this._toast.parent = Configuration.UserInterface;
            this._toast.layer = Layers.Enum.UI_2D;
            this._toast.setSiblingIndex(-1);
        }
        return this._toast;
    }
    /**
     * 显示Toast
     * @param message 文本
     * @param timeout 持续时间(秒)，默认2秒
     */
    public static showToast(message: string, timeout?: number) {
        UIManager.toast.setSiblingIndex(-1);
        UIManager.toast.getComponent(UIToast).add({
            message, timeout
        });
    }
    /**
     * 清理Toast
     */
    public static clearToast() {
        if (!UIManager.toast) return;
        UIManager.toast.getComponent(UIToast).clear();
    }

    ////////////////////////// touch //////////////////////////
    // 全局触摸有效
    private static touchEnabled: boolean = true;
    // 记录触摸屏蔽
    private static touchMaskMap = new Map<number, boolean>();

    private static addTouchMaskListener() {
        if (!this.touchEnabled) return;
        if (this.touchMaskMap.size > 0) return;

        for (let i = 0; i < BlockEvents.length; i++) {
            Configuration.Canvas.node.on(BlockEvents[i], this.stopPropagation, this, true);
        }
    }
    private static removeTouchMaskListener() {
        if (!this.touchEnabled) return;
        if (this.touchMaskMap.size > 0) return;

        for (let i = 0; i < BlockEvents.length; i++) {
            Configuration.Canvas.node.off(BlockEvents[i], this.stopPropagation, this, true);
        }
    }
    private static stopPropagation(event: Event) {
        if (!this.touchEnabled || this.touchMaskMap.size > 0) {
            event.propagationStopped = true;
            if (event.type !== Node.EventType.MOUSE_MOVE) {
                log('[UIManager]', '屏蔽触摸');
            }
        }
    }

    /**
     * 添加触摸屏蔽
     * @param timeout 毫秒
     * @returns 
     */
    public static addTouchMask(timeout = 0) {
        this.addTouchMaskListener();
        const uuid = createUUID();
        this.touchMaskMap.set(uuid, true);
        if (timeout > 0) setTimeout(() => {
            this.removeTouchMask(uuid);
        }, timeout);
        return uuid;
    }

    /**
     * 移除触摸屏蔽
     * @param uuid addTouchMask的返回值
     */
    public static removeTouchMask(uuid: number) {
        if (!uuid) return;
        this.touchMaskMap.delete(uuid);
        this.removeTouchMaskListener();
    }

    /**
     * 设置触摸是否启用
     * @param enabled 是否启用
     */
    public static setTouchEnabled(enabled: boolean) {
        if (enabled) {
            this.touchEnabled = true;
            this.removeTouchMaskListener();
        } else {
            this.addTouchMaskListener();
            this.touchEnabled = false;
        }
        warn('[UIManager]', 'setTouchEnabled', this.touchEnabled);
    }

    private tryShowing: boolean = false;
    private showCommandList: ShowCommand[] = [];
    private viewInfoMap: Map<string, ViewInfo> = new Map();
    private prefabCacheMap: Map<string, Prefab> = new Map();

    private static instList: UIManager[] = [];
    public constructor(module: BaseModule) {
        super(module);
        UIManager.instList.push(this);
    }

    /**
     * 释放缓存
     */
    public release(): void {
        this.viewInfoMap.forEach(info => info.clear());
        UIManager.instList.splice(UIManager.instList.indexOf(this), 1);

        this.tryShowing = false;
        this.viewInfoMap.clear();
        this.prefabCacheMap.clear();
        this.showCommandList.length = 0;
    }

    private getViewInfo(view: typeof BaseView | BaseView): ViewInfo {
        if (view instanceof BaseView) {
            return this.viewInfoMap.get(view.viewName);
        } else {
            const viewName = js.getClassName(view);
            return this.viewInfoMap.get(viewName);
        }
    }

    public isLoading(view: typeof BaseView): boolean {
        const viewInfo = this.getViewInfo(view);
        if (!viewInfo) return false;
        return viewInfo.viewState === ViewState.Loading;
    }

    public isShowing(view: typeof BaseView | BaseView): boolean {
        const viewInfo = this.getViewInfo(view);
        if (!viewInfo) return false;
        return viewInfo.viewState === ViewState.Showing;
    }

    private LoadScene(viewName: string, onCompleted: (scene: SceneAsset) => void, onProgress?: (progress: number) => void): void {
        const assetName = this.module.isGlobal
            ? `global-view/${viewName}`
            : `module-view/${viewName}`;

        this.module.loadAsset(assetName, SceneAsset, onCompleted, onProgress);
    }

    private LoadPrefab(viewName: string, onCompleted: (prefab: Prefab) => void, onProgress?: (progress: number) => void): void {
        const assetName = this.module.isGlobal
            ? `global-view/${viewName}`
            : `module-view/${viewName}`;

        if (this.prefabCacheMap.has(assetName)) {
            Promise.resolve().then(() => {
                onCompleted(this.prefabCacheMap.get(assetName));
            });
        } else {
            this.module.loadAsset(assetName, Prefab, (prefab) => {
                this.prefabCacheMap.set(assetName, prefab);
                onCompleted(prefab);
            }, onProgress);
        }
    }

    public preload(view: typeof BaseView, onCompleted?: () => void, onProgress?: (progress: number) => void): void {
        const viewName = js.getClassName(view);
        const typeName = getViewTypeName(viewName);

        if (typeName === ViewType.Page) {
            this.LoadScene(viewName, onCompleted, onProgress);
        } else {
            this.LoadPrefab(viewName, onCompleted, onProgress);
        }
    }

    private tryShow() {
        this.tryShowing = true;

        if (this.showCommandList.length === 0) {
            this.tryShowing = false;
            return;
        }
        const command = this.showCommandList[0];
        const moduleName = this.module.moduleName;
        const viewName = js.getClassName(command.viewType);
        const typeName = getViewTypeName(viewName);
        const fullName = `${moduleName}:${viewName}`;

        BaseView.innerBeforeShow(this.module, command.viewType, command.data).then(() => {
            if (!this.viewInfoMap.has(viewName)) {
                this.viewInfoMap.set(viewName, new ViewInfo(moduleName));
            }
            const viewInfo = this.viewInfoMap.get(viewName);

            // 可直接使用的状态
            if (isValid(viewInfo.viewComp)) {
                Promise.resolve().then(() => {
                    if (this.showCommandList.indexOf(command) !== 0) {
                        this.tryShow();
                        return;
                    }
                    this.showCommandList.shift();

                    viewInfo.viewComp.node.active = true;
                    viewInfo.viewState = ViewState.Showing;

                    BaseView.innerShow(viewInfo.viewComp, command.data, command.onHide);
                    UIManager.refreshShadow();
                    command.onShow?.();
                    this.tryShow();
                });
            } else {
                // 需要下载
                viewInfo.viewState = ViewState.Loading;

                if (typeName === ViewType.Page) {
                    this.LoadScene(viewName, (sceneAsset: SceneAsset) => {
                        if (this.showCommandList.indexOf(command) !== 0) {
                            this.tryShow();
                            return;
                        }
                        this.showCommandList.shift();

                        if (viewInfo.viewState !== ViewState.Loading) {
                            this.tryShow();
                            return;
                        }

                        if (!sceneAsset) {
                            this.error(`${viewName}加载Scene失败`);
                            viewInfo.viewState = ViewState.None;
                            command.onError && command.onError();
                            this.tryShow();
                            return;
                        }

                        director.runSceneImmediate(sceneAsset, null, (err, scene) => {
                            if (err) {
                                this.error(`${viewName}加载Scene失败`);
                                viewInfo.viewState = ViewState.None;
                                command.onError && command.onError();
                                this.tryShow();
                                return;
                            }
                            const rootNodes = scene.children;
                            const gameObject = rootNodes.find(node => {
                                return node.getComponent(BaseView) != null;
                            });
                            if (gameObject) {
                                const view = gameObject.getComponent(BaseView);
                                viewInfo.viewState = ViewState.Showing;
                                viewInfo.viewComp = view;
                                gameObject.name = fullName;

                                BaseView.innerShow(view, command.data, command.onHide);
                                UIManager.refreshShadow();
                                command.onShow?.();
                                this.tryShow();
                            } else {
                                this.error(`${viewName}中未查询到BaseView组件`);
                                viewInfo.viewState = ViewState.None;
                                this.tryShow();
                            }
                        });
                    }, command.onProgress);
                } else {
                    this.LoadPrefab(viewName, (prefab) => {
                        if (this.showCommandList.indexOf(command) !== 0) {
                            this.tryShow();
                            return;
                        }
                        this.showCommandList.shift();

                        if (viewInfo.viewState !== ViewState.Loading) {
                            this.tryShow();
                            return;
                        }

                        if (!prefab) {
                            this.error(`${viewName}加载UI失败`);
                            viewInfo.viewState = ViewState.None;
                            command.onError && command.onError();
                            this.tryShow();
                            return;
                        }

                        const root = Configuration.UserInterface.getChildByName(typeName);
                        const gameObject = instantiate(prefab);
                        gameObject.parent = root;
                        gameObject.name = fullName;

                        const view = gameObject.getComponent(BaseView);
                        if (view) {
                            viewInfo.viewState = ViewState.Showing;
                            viewInfo.viewComp = view;

                            BaseView.innerShow(view, command.data, command.onHide);
                            UIManager.refreshShadow();
                            command.onShow?.();
                            this.tryShow();
                        } else {
                            this.error(`${viewName}中未查询到BaseView组件`);
                            viewInfo.viewState = ViewState.None;
                            this.tryShow();
                        }
                    }, command.onProgress);
                }
            }
        }).catch(() => {
            this.showCommandList.shift();
            this.tryShow();
        });
    }

    /**
     * 展示一个UI
     * - 此流程一定是异步的
     * - 不可以在beforeShow中调用
     * - 展示顺序会严格按照show的调用顺序
     */
    public show<T extends typeof BaseView>(params: {
        view: T,
        data?: any,
        onShow?: () => void,
        onHide?: (data: any) => void,
        onError?: () => void,
        onProgress?: (progress: number) => void
    }): void {
        this.showCommandList.push({
            viewType: params.view,
            data: params.data,
            onShow: params.onShow,
            onHide: params.onHide,
            onError: params.onError,
            onProgress: params.onProgress
        });
        if (this.tryShowing == false) {
            this.tryShow();
        }
    }

    /**
     * 关闭UI
     * - 此流程一定是同步的
     */
    public hide(view: keyof typeof ViewType): void;
    public hide(view: typeof BaseView): void;
    public hide(view: BaseView): void;
    public hide(view: typeof BaseView | BaseView | keyof typeof ViewType): void {
        this.viewInfoMap.forEach((viewSource, viewName) => {
            if (typeof view === 'string') {
                if (getViewTypeName(viewName) !== view) return;
            } else if (view instanceof BaseView) {
                if (viewSource.viewComp !== view) return;
            } else {
                if (!(viewSource.viewComp instanceof view)) return;
            }

            if (viewSource.viewState === ViewState.Showing) {
                if (BaseView.innerHide(viewSource.viewComp)) {
                    viewSource.viewState = ViewState.Hiding;
                    if (viewSource.viewComp.hideMode === BaseView.ViewHideMode.Active) {
                        viewSource.viewComp.node.active = false;
                    } else {
                        viewSource.viewComp.node.destroy();
                        viewSource.viewComp = null;
                    }
                }
            } else {
                viewSource.viewState = ViewState.Hiding;
            }
        });

        UIManager.refreshShadow();
    }

    /**
     * 关闭一类UI
     * - 此流程一定是同步的
     */
    public static hideAll(view: keyof typeof ViewType): void {
        UIManager.instList.forEach((uiMgr) => {
            uiMgr.hide(view);
        });
    }
}

if (DEV || DEBUG) {
    //@ts-ignore
    window['UIManager'] = UIManager;
}