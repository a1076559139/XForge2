
export function getModuleAssemblyMeta(name: string) {
    return {
        userData: {
            'isBundle': true,
            'priority': 1,
            'bundleName': name,
            'bundleConfigID': 'auto_f7NI9WxFVIO6e8LbJGF72k'
        }
    };
}

export function getModuleAssetBundleMeta(name: string, isGlobal: boolean) {
    return {
        userData: {
            'isBundle': true,
            'priority': isGlobal ? 6 : 5,
            'bundleName': name + '-res',
            'bundleConfigID': 'auto_11aBEBWDxI/6ryvKvFthEo'
        }
    };
}