import { _decorator } from 'cc';
import { BaseModule } from 'db://xforge/base/BaseModule';
import { BaseView } from 'db://xforge/base/BaseView';
import { app } from 'db://xforge/XForge';
import { GeneralEvent, GeneralService } from '../module-service/GeneralService';
import { PaperHome1 } from './PaperHome1';
import { PaperHome2 } from './PaperHome2';
import { PaperHome3 } from './PaperHome3';
const { ccclass, property } = _decorator;

@ccclass('PageHome')
export class PageHome extends BaseView {

    protected static beforeShow(module: BaseModule, data: any): Promise<void> {
        return new window.Promise((resolve, reject) => {
            // 不可以在beforeShow中调用module.ui.show
            app.lib.task.createASync()
                .add(next => module.ui.preload(PaperHome1, next))
                .add(next => module.ui.preload(PaperHome2, next))
                .add(next => module.ui.preload(PaperHome3, next))
                .start(resolve);
        });
    }

    protected onShow(data: any) {
        this.module.sound.playMusic('home');
        // UI的展示顺序会严格按照show的调用顺序
        app.lib.task.createASync()
            .add(next => {
                this.module.ui.show({
                    view: PaperHome1, onShow: () => {
                        this.log('展示PaperHome1', Date.now());
                        next();
                    },
                });
            })
            .add(next => {
                this.module.ui.show({
                    view: PaperHome2, onShow: () => {
                        this.log('展示PaperHome2', Date.now());
                        next();
                    },
                });
            })
            .add(next => {
                this.module.ui.show({
                    view: PaperHome3, onShow: () => {
                        this.log('展示PaperHome3', Date.now());
                        next();
                    },
                });
            })
            .start(() => {
                this.log('发送全局事件');
                app.global.useService(GeneralService)
                    .event.emit(new GeneralEvent('XForge2', 100));
            });
    }

    protected beforeHide(): void {
        // throw new Error("抛出错误表示终止Hide流程");
    }

    protected onHide(): any {
        // 返回的数据会在onHide回调中接收
        return null;
    }
}