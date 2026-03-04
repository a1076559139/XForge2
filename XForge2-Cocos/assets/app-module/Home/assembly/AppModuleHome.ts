import { BaseModule, module } from 'db://xforge/base/BaseModule';
import { PageHome } from './module-view/PageHome';

@module('Home')
export class Module extends BaseModule {
    protected init(onLoaded: () => void, onError: () => void, onProgress: (result: number) => void): void {
        this.ui.show({
            view: PageHome,
            onShow: onLoaded,
            onError: onError,
            onProgress: onProgress
        });
    }

    protected onLoad(): void {
    }
}