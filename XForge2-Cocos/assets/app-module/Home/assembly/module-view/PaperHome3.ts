import { _decorator } from 'cc';
import { BaseModule } from 'db://xforge/base/BaseModule';
import { BaseView } from 'db://xforge/base/BaseView';
import { app } from 'db://xforge/XForge';
import { GeneralEvent, GeneralService } from '../module-service/GeneralService';
const { ccclass, property } = _decorator;

@ccclass('PaperHome3')
export class PaperHome3 extends BaseView {

    protected static beforeShow(module: BaseModule, data: any): Promise<void> {
        return new window.Promise((resolve, reject) => {
            // 调用resolve表示Promise流程结束，可以在一个异步函数完成后调用
            // 调用reject表示Promise流程异常，最终会导致终止View的Show流程
            resolve();
        });
    }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    protected onShow(data: any) {
        app.global.useService(GeneralService)
            .event.once(GeneralEvent, (evt) => {
                this.log(`接收全局事件：${evt.name} ${evt.age}`);
            });
    }

    protected beforeHide(): void {
        // throw new Error("抛出错误表示终止Hide流程");
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    protected onHide(): any {
        // 返回的数据会在onHide回调中接收
        return null;
    }
}