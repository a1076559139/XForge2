import { MessageOptions } from 'element-plus';
import { Ref } from 'vue';
import { getAssemblyMeta, getAssetBundleMeta } from './meta';
import { getReadme } from './readme';
import { createDirectoryByUrl, isUrlExists } from './utils';

// 创建模块
export async function CreateModule(moduleName: string = ''): Promise<MessageOptions> {
    if (moduleName && !/^[A-Z][a-zA-Z0-9]*$/.test(moduleName)) {
        return { type: 'warning', message: '名称必须以大写字母开头且只包含字母数字' };
    }

    if (moduleName && moduleName.toLowerCase().endsWith('global')) {
        return { type: 'warning', message: '名称不能以 Global 结尾' };
    }

    if (moduleName && moduleName.toLowerCase().endsWith('module')) {
        return { type: 'warning', message: '名称不能以 Module 结尾' };
    }

    if (moduleName && moduleName.toLowerCase() === 'global') {
        return { type: 'warning', message: '名称不能为Global' };
    }

    if (moduleName && moduleName.toLowerCase() === 'module') {
        return { type: 'warning', message: '名称不能为Module' };
    }

    const moduleKeyword = moduleName ? 'module' : 'global';
    const moduleBundleName = moduleName ? `app-module-${moduleName}`.toLowerCase() : 'app-global';
    const moduleFileName = moduleName ? `AppModule${moduleName}` : 'AppGlobal';
    const moduleFileUrl = moduleName
        ? `db://assets/app-module/${moduleName}`
        : 'db://assets/app-global';

    if (isUrlExists(moduleFileUrl)) {
        return { type: 'warning', message: `模块 ${moduleName} 已存在` };
    }

    let result = await createDirectoryByUrl({
        url: moduleFileUrl,
        readme: getReadme(moduleName ? 'module' : 'global'),
        subFolders: [
            {
                name: 'assembly',
                meta: getAssemblyMeta(moduleBundleName)
            },
            {
                name: 'assetbundle',
                meta: getAssetBundleMeta(moduleBundleName)
            }
        ]
    });

    if (!result) {
        return ({ type: 'error', message: '模块创建失败' });
    }

    result = await createDirectoryByUrl({
        url: `${moduleFileUrl}/assembly`,
        readme: getReadme('assembly'),
        subFolders: [
            {
                name: 'content'
            },
            {
                name: moduleKeyword + '-view'
            },
            {
                name: moduleKeyword + '-model'
            },
            {
                name: moduleKeyword + '-service'
            }
        ]
    });

    if (!result) {
        return ({ type: 'error', message: '模块创建失败' });
    }

    result = await createDirectoryByUrl({
        url: `${moduleFileUrl}/assetbundle`,
        readme: getReadme('assetbundle'),
        subFolders: [
            {
                name: 'content'
            },
            {
                name: moduleKeyword + '-view'
            },
            {
                name: moduleKeyword + '-sound'
            }
        ]
    });
    if (!result) {
        return ({ type: 'error', message: '模块创建失败' });
    }

    const scriptUrl = `${moduleFileUrl}/assembly/${moduleFileName}.ts`;
    const scriptContent = moduleName
        ? `import { BaseModule, module } from 'db://xforge/base/BaseModule';

@module('${moduleName}')
export class Module extends BaseModule {
    protected init(onLoaded: () => void, onError: () => void, onProgress: (progress: number) => void): void {
        // this.ui.show({
        //     view: PageXXX,
        //     onShow: onLoaded,
        //     onError: onError,
        //     onProgress: onProgress
        // });
    }

    protected onLoad(): void {
    }
}`
        : `import { BaseModule, global } from 'db://xforge/base/BaseModule';

@global()
export class Global extends BaseModule {
    protected init(onLoaded: () => void, onError: () => void, onProgress: (progress: number) => void): void {
        super.init(onLoaded, onError, onProgress);
    }

    protected onLoad(): void {
    }
}`;

    const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptUrl, scriptContent).catch(_ => null);
    if (!createScriptResult) {
        return ({ type: 'error', message: `${scriptUrl} 创建失败` });
    }
    Editor.Message.send('assets', 'twinkle', scriptUrl);

    return ({ type: 'success', message: '模块创建成功' });
}

// 创建model
function getModelScript(name: string) {
    return `import { BaseModel } from 'db://xforge/base/BaseModel';
export class ${name} extends BaseModel {

}`;
}
export async function createModelItem(modelType: 'Data' | 'Config', inputName: string, moduleName = ''): Promise<MessageOptions> {
    if (modelType.trim() === '') {
        return ({ type: 'warning', message: '请选择类型' });
    }

    if (!inputName.trim()) {
        return { type: 'warning', message: '名称不能为空' };
    }

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(inputName)) {
        return { type: 'warning', message: '名称必须以大写字母开头且只包含字母数字' };
    }

    if (inputName.toLowerCase().endsWith('data') || inputName.toLowerCase().endsWith('config')) {
        return { type: 'warning', message: '名称不能以Data或Config结尾' };
    }

    const scriptUrl = moduleName
        ? `db://assets/app-module/${moduleName}/assembly/module-model/${inputName}${modelType}.ts`
        : `db://assets/app-global/assembly/global-model/${inputName}${modelType}.ts`;
    if (isUrlExists(scriptUrl)) {
        return { type: 'warning', message: `${scriptUrl} 文件已存在` };
    }

    const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptUrl, getModelScript(inputName)).catch(_ => null);
    if (!createScriptResult) {
        return { type: 'error', message: `${scriptUrl} 创建失败` };
    }
    Editor.Message.send('assets', 'twinkle', scriptUrl);

    return { type: 'success', message: '创建成功' };
}

// 创建view
/**
 * 获取脚本内容
 */
function getViewScript(name: string) {
    return `import { _decorator, Node } from 'cc';
import { BaseView } from 'db://xforge/base/BaseView';
import { BaseModule } from 'db://xforge/base/BaseModule';
const { ccclass, property } = _decorator;

@ccclass('${name}')
export class ${name} extends BaseView {

    protected static beforeShow(module: BaseModule, data: any): Promise<void> {
        return new window.Promise((resolve, reject) => {
            // 调用resolve表示Promise流程结束，可以在一个异步函数完成后调用
            // 调用reject表示Promise流程异常，最终会导致终止View的Show流程
            resolve();
        });
    }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    protected onShow(data: any) {
    
    }

    protected beforeHide(): void {
        // throw new Error("抛出错误表示终止Hide流程");
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    protected onHide(): any {
        // 返回的数据会在onHide回调中接收
        return null;
    }
}`;
}
export async function createViewItem(viewType: string, inputName: string, moduleName = ''): Promise<MessageOptions> {
    if (viewType.trim() === '') {
        return ({ type: 'warning', message: '请选择类型' });
    }

    if (!inputName.trim()) {
        return ({ type: 'warning', message: '名称不能为空' });
    }

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(inputName)) {
        return ({ type: 'warning', message: '名称必须以大写字母开头且只包含字母数字' });
    }

    if (/(Page|Paper|Pop|Top)/.test(inputName)) {
        return ({ type: 'warning', message: '名称中不能包含Page、Paper、Pop、Top' });
    }

    // 创建脚本文件
    const className = `${viewType}${inputName}`;
    const scriptUrl = moduleName
        ? `db://assets/app-module/${moduleName}/assembly/module-view/${className}.ts`
        : `db://assets/app-global/assembly/global-view/${className}.ts`;

    if (isUrlExists(scriptUrl)) {
        return ({ type: 'warning', message: `${scriptUrl} 文件已存在` });
    }

    const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptUrl, getViewScript(className)).catch(_ => null);
    if (!createScriptResult) {
        return ({ type: 'error', message: `${scriptUrl} 创建失败` });
    }
    Editor.Message.send('assets', 'twinkle', scriptUrl);

    // 创建预制体文件
    const prefabUrl = moduleName
        ? `db://assets/app-module/${moduleName}/assetbundle/module-view/${className}.prefab`
        : `db://assets/app-global/assetbundle/global-view/${className}.prefab`;
    const sceneUrl = moduleName
        ? `db://assets/app-module/${moduleName}/assetbundle/module-view/${className}.scene`
        : `db://assets/app-global/assetbundle/global-view/${className}.scene`;

    if (isUrlExists(prefabUrl)) {
        return ({ type: 'warning', message: `${sceneUrl} 文件已存在` });
    }
    if (isUrlExists(prefabUrl)) {
        return ({ type: 'warning', message: `${prefabUrl} 文件已存在` });
    }

    // 创建view
    if (viewType === 'Page') {
        const createSceneResult = await Editor.Message.request('scene', 'execute-scene-script', {
            name: 'xforge',
            method: 'createScene',
            args: [className, sceneUrl]
        }).catch(_ => null);
        if (!createSceneResult) {
            return ({ type: 'error', message: `${sceneUrl} 创建失败` });
        }
        Editor.Message.send('assets', 'twinkle', sceneUrl);
    } else {
        const createPrefabResult = await Editor.Message.request('scene', 'execute-scene-script', {
            name: 'xforge',
            method: 'createPrefab',
            args: [className, prefabUrl]
        }).catch(_ => null);
        if (!createPrefabResult) {
            return ({ type: 'error', message: `${createPrefabResult} 创建失败` });
        }
        Editor.Message.send('assets', 'twinkle', prefabUrl);
    }

    return ({ type: 'success', message: '创建成功' });
}

// 创建Service
function getServiceScript(name: string) {
    return `import { BaseService } from 'db://xforge/base/BaseService';
export class ${name} extends BaseService {

}`;
}
export async function createServiceItem(inputName: string, moduleName = ''): Promise<MessageOptions> {
    if (!inputName.trim()) {
        return ({ type: 'warning', message: '名称不能为空' });
    }

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(inputName)) {
        return ({ type: 'warning', message: '名称必须以大写字母开头且只包含字母数字' });
    }

    if (inputName.toLowerCase().endsWith('service')) {
        return ({ type: 'warning', message: '名称不能以Service结尾' });
    }

    const className = inputName + 'Service';
    const scriptUrl = moduleName
        ? `db://assets/app-module/${moduleName}/assembly/module-service/${className}.ts`
        : `db://assets/app-global/assembly/global-service/${className}.ts`;

    if (isUrlExists(scriptUrl)) {
        return ({ type: 'warning', message: `${scriptUrl} 文件已存在` });
    }

    const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptUrl, getServiceScript(className)).catch(_ => null);
    if (!createScriptResult) {
        return ({ type: 'error', message: `${scriptUrl} 创建失败` });
    }
    Editor.Message.send('assets', 'twinkle', scriptUrl);

    return ({ type: 'success', message: '创建成功' });
}

// 创建sound
export async function createSoundItem(soundType: Ref<string>, moduleName = ''): Promise<MessageOptions> {
    if (soundType.value.trim() === '') {
        return ({ type: 'warning', message: '请选择类型' });
    }

    const url = moduleName
        ? `db://assets/app-module/${moduleName}/assetbundle/module-sound`
        : 'db://assets/app-global/assetbundle/global-sound';

    const success = await createDirectoryByUrl({
        url: url,
        subFolders: [
            {
                name: soundType.value === '音乐目录' ? 'music' : 'effect'
            }
        ]
    });
    if (!success) {
        return ({ type: 'error', message: `${soundType.value} 创建失败` });
    }

    Editor.Message.send('assets', 'twinkle', url);
    return ({ type: 'success', message: `${soundType.value} 创建成功` });
}