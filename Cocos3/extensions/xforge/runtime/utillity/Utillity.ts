function joinPath(...paths: string[]): string {
    return paths.join('/');
}

let uuid = 0;
export function createUUID() {
    return Date.now() + (uuid++);
}

export class AppManagerUtility {
    /** 基础目录 */
    public static readonly RootPath: string = 'assets/app-manager';
}

export class AppGlobalUtility {
    /** 基础目录 */
    public static readonly RootPath: string = 'assets/app-global';

    //////////////////////////AssetBundle//////////////////////////
    /**
     * 获取完整路径(assets/app-global/开头)
     */
    public static getAssetBundlePath(): string {
        return joinPath(this.RootPath, 'resources');
    }

    /**
     * 获取完整路径(assets/app-global/开头)
     */
    public static getABViewPath(): string {
        return joinPath(this.getAssetBundlePath(), 'global-view');
    }

    /**
     * 获取完整路径(assets/app-global/开头)
     */
    public static getABSoundPath(): string {
        return joinPath(this.getAssetBundlePath(), 'global-sound');
    }

    //////////////////////////Assembly//////////////////////////
    /**
     * 获取完整路径(assets/app-global/开头)
     */
    public static getAssemblyPath(): string {
        return joinPath(this.RootPath, 'assembly');
    }

    /**
     * 获取完整路径(assets/app-global/开头)
     */
    public static getAsmServicePath(): string {
        return joinPath(this.getAssemblyPath(), 'global-service');
    }

    /**
     * 获取完整路径(assets/app-global/开头)
     */
    public static getAsmModelPath(): string {
        return joinPath(this.getAssemblyPath(), 'global-model');
    }

    /**
     * 获取完整路径(assets/app-global/开头)
     */
    public static getAsmViewPath(): string {
        return joinPath(this.getAssemblyPath(), 'global-view');
    }

    /**
     * 获取模块入口类名
     */
    public static getModuleTypeName(): string {
        return 'XForge.Global.Global';
    }

    /**
     * 获取程序集名
     */
    public static getAssemblyName(): string {
        return 'app-global';
    }

    /**
     * 获取AssetBundle名
     */
    public static getAssetBundleName(): string {
        return 'app-global-res';
    }
}

export class AppModuleUtility {
    /** 基础目录 */
    public static readonly RootPath: string = 'assets/app-module';

    /**
     * 获取完整路径(assets/app-module/开头)
     * @param moduleName 模块名
     */
    public static getmodulePath(moduleName: string): string {
        return joinPath(this.RootPath, moduleName);
    }

    //////////////////////////AssetBundle//////////////////////////
    /**
     * 获取完整路径(assets/app-module/开头)
     * @param moduleName 模块名
     */
    public static getAssetBundlePath(moduleName: string): string {
        return joinPath(this.getmodulePath(moduleName), 'resources');
    }

    /**
     * 获取完整路径(assets/app-module/开头)
     * @param moduleName 模块名
     */
    public static getABViewPath(moduleName: string): string {
        return joinPath(this.getAssetBundlePath(moduleName), 'module-view');
    }

    /**
     * 获取完整路径(assets/app-module/开头)
     * @param moduleName 模块名
     */
    public static getABSoundPath(moduleName: string): string {
        return joinPath(this.getAssetBundlePath(moduleName), 'module-sound');
    }

    //////////////////////////Assembly//////////////////////////
    /**
     * 获取完整路径(assets/app-module/开头)
     * @param moduleName 模块名
     */
    public static getAssemblyPath(moduleName: string): string {
        return joinPath(this.getmodulePath(moduleName), 'assembly');
    }

    /**
     * 获取完整路径(assets/app-module/开头)
     * @param moduleName 模块名
     */
    public static getAsmServicePath(moduleName: string): string {
        return joinPath(this.getAssemblyPath(moduleName), 'module-service');
    }

    /**
     * 获取完整路径(assets/app-module/开头)
     * @param moduleName 模块名
     */
    public static getAsmModelPath(moduleName: string): string {
        return joinPath(this.getAssemblyPath(moduleName), 'module-model');
    }

    /**
     * 获取完整路径(assets/app-module/开头)
     * @param moduleName 模块名
     */
    public static getAsmViewPath(moduleName: string): string {
        return joinPath(this.getAssemblyPath(moduleName), 'module-view');
    }

    /**
     * 获取模块入口类名
     * @param moduleName 模块名
     */
    public static getModuleTypeName(moduleName: string): string {
        return `XForge.Module.${moduleName}.Module`;
    }

    /**
     * 获取程序集名
     * @param moduleName 模块名
     */
    public static getAssemblyName(moduleName: string): string {
        return `app-module-${moduleName}`.toLowerCase();
    }

    /**
     * 获取AssetBundle名
     * @param moduleName 模块名
     */
    public static getAssetBundleName(moduleName: string): string {
        return `app-module-${moduleName}-res`.toLowerCase();
    }
}
