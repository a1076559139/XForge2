
export function getAssemblyMeta(name: string) {
    return {
        userData: {
            'isBundle': true,
            'bundleName': name,
            'bundleConfigID': 'auto_f7NI9WxFVIO6e8LbJGF72k'
        }
    };
}

export function getAssetBundleMeta(name: string) {
    return {
        userData: {
            'isBundle': true,
            'priority': 8,
            'bundleName': name + '-res',
            'bundleConfigID': 'auto_11aBEBWDxI/6ryvKvFthEo'
        }
    };
}