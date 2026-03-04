import { BaseModule, global } from 'db://xforge/base/BaseModule';

@global()
export class Global extends BaseModule {
    protected init(onLoaded: () => void, onError: () => void, onProgress: (progress: number) => void): void {
        super.init(onLoaded, onError, onProgress);
    }

    protected onLoad(): void {
    }
}