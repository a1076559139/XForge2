import { existsSync, readdirSync, writeFileSync } from 'fs';
import { basename, join } from 'path';

export function getFoldersSync(dirPath: string) {
    if (!existsSync(dirPath)) {
        return [];
    }
    try {
        const items = readdirSync(dirPath, { withFileTypes: true });
        return items
            .filter(item => item.isDirectory())
            .map(item => item.name);
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
}

export function getFilesSync(dirPath: string) {
    if (!existsSync(dirPath)) {
        return [];
    }
    try {
        const items = readdirSync(dirPath, { withFileTypes: true });
        return items
            .filter(item => !item.isDirectory())
            .map(item => item.name);
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
}

export function isUrlExists(url: string) {
    return existsSync(convertUrlToPath(url));
}

export function isPathExists(path: string) {
    return existsSync(path);
}

/**
 * db下的路径转换为真实路径
 */
export function convertUrlToPath(url: string) {
    if (url.startsWith('db://assets')) {
        url = Editor.Utils.Path.join(Editor.Project.path, url.slice(5));
    } else if (url.startsWith('db://xforge')) {
        url = Editor.Utils.Path.join(Editor.Project.path, 'extensions/xforge/runtime', url.slice(8));
    }
    return url;
}

/**
 * 根据db://assets路径创建目录(不是文件)
 * 如果已存在不会重复创建
 */
export async function createDirectoryByUrl(params: {
    url: string,
    readme?: string,
    meta?: { userData: object },
    subFolders?: {
        name: string,
        readme?: string,
        meta?: { userData: object },
    }[]
}) {
    let pathHead = 'db://assets';

    if (!params.url || !params.url.startsWith(pathHead)) {
        return false;
    }

    // 修剪url
    const pathTail = params.url.endsWith('/') ? params.url.slice(pathHead.length + 1, -1).trim() : params.url.slice(pathHead.length + 1).trim();

    // 每一层的路径
    const pathArr = pathTail.split('/');

    // 创建主目录
    for (let index = 0; index < pathArr.length; index++) {
        pathHead += '/' + pathArr[index];

        if (!existsSync(convertUrlToPath(pathHead))) {
            const result = await Editor.Message.request('asset-db', 'create-asset', pathHead, null).catch(_ => null);
            if (!result) return false;
        }
    }

    // 主目录meta
    if (params?.meta) {
        await waitingForUrl(`${params.url}.meta`);
        await delay(100);
        const queryMeta = await Editor.Message.request('asset-db', 'query-asset-meta', params.url).catch(_ => null);
        if (!queryMeta) return false;
        Object.assign(queryMeta.userData, params.meta.userData);

        const result = await Editor.Message.request('asset-db', 'save-asset-meta', params.url, JSON.stringify(queryMeta)).catch(_ => null);
        if (!result) return false;
    }

    // 主目录readme
    if (params?.readme) {
        writeFileSync(join(convertUrlToPath(params.url), `.${basename(params.url)}.md`), params.readme);
    }

    // 创建子目录
    if (params?.subFolders) {
        await delay(100);
        for (let index = 0; index < params.subFolders.length; index++) {
            const subFolder = params.subFolders[index];
            const subUrl = `${pathHead}/${subFolder.name}`;

            // 判断是否存在
            if (!existsSync(convertUrlToPath(subUrl))) {
                const result = await Editor.Message.request('asset-db', 'create-asset', subUrl, null).catch(_ => null);
                if (!result) return false;
            }

            // meta
            if (subFolder.meta) {
                await waitingForUrl(`${subUrl}.meta`);
                const queryMeta = await Editor.Message.request('asset-db', 'query-asset-meta', subUrl).catch(_ => null);
                if (!queryMeta) return false;
                Object.assign(queryMeta.userData, subFolder.meta.userData);

                const result = await Editor.Message.request('asset-db', 'save-asset-meta', subUrl, JSON.stringify(queryMeta)).catch(_ => null);
                if (!result) return false;
            }

            // readme
            if (subFolder.readme) {
                writeFileSync(join(convertUrlToPath(subUrl), `.${basename(subUrl)}.md`), subFolder.readme);
            }
        }
    }

    return true;
}

export function delay(time: number) {
    return new Promise((next) => {
        setTimeout(() => {
            next(null);
        }, time);
    });
}

/**
 * 等待文件存在
 */
export function waitingForUrl(url: string) {
    const path = convertUrlToPath(url);
    let timer: NodeJS.Timeout | null = null;
    return new Promise((next) => {
        timer = setInterval(() => {
            if (existsSync(path)) {
                if (timer) clearInterval(timer);
                timer = null;
                next(null);
            }
        }, 100);
    });
}
