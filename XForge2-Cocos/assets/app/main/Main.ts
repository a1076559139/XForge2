import { _decorator, game, Node, sys } from 'cc';
import { BaseMain } from 'db://xforge/base/BaseMain';
import { SoundManager } from 'db://xforge/mgr/sound/SoundManager';
import { UIManager } from 'db://xforge/mgr/ui/UIManager';
import { app, ModuleNames } from '../app';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends BaseMain {
    @property({
        type: Node,
        displayName: '启动页'
    })
    public splashScreen: Node;

    protected onLoad(): void {
        // 设置音乐/音效音量倍率
        SoundManager.musicVolumeScale = 1;
        SoundManager.effectVolumeScale = 1;
        // 开启自动适配分辨率
        UIManager.useAutoResolutionFit();
        // 让帧率更稳定
        if (sys.isBrowser) {
            game.frameRate = 100;
        }
    }

    protected start(): void {
        // 创建顺序执行的任务
        app.lib.task.createSync()
            .add((next) => {
                // 初始化
                this.setup();
                next();
            })
            .add((next, retry) => {
                // 加载全局模块
                app.loadGlobal({
                    onLoaded: next,
                    onError: retry
                });
            })
            .add((next, retry) => {
                // 加载功能模块
                app.loadModule({
                    name: ModuleNames.Home,
                    onLoaded: next,
                    onError: retry
                });
            })
            .start(() => {
                // 销毁启动页
                this.splashScreen.destroy();
            });
    }
}
