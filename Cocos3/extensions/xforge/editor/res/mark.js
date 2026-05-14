(() => {
    function updateAssetMark(assetDock) {
        const treeNodeList = assetDock.querySelectorAll('div.tree-node');
        if (!treeNodeList) return;

        treeNodeList.forEach((treeNode) => {
            const isExpand = treeNode.__vue__?.$props?.expand;
            const isDirectory = treeNode.__vue__?.$props?.asset?.isDirectory;
            const assetUrl = treeNode.__vue__?.$props?.asset?.url || '';
            const assetName = treeNode.__vue__?.$props?.asset?.name || '';
            // asset所在文件夹的url(结尾不带/)
            const assetFolderUrl = assetUrl.slice(0, assetUrl.length - assetName.length - 1);
            // asset所在文件夹名称(结尾不带/)
            const assetFolderName = assetUrl.slice(0, assetUrl.length - assetName.length - 1).split('/').pop();

            const itemDiv = treeNode.getElementsByTagName('ui-drag-item')[0];

            // 子节点-label
            const nameDiv = itemDiv.getElementsByClassName('name')[0];
            const nameUI = nameDiv ? nameDiv.getElementsByTagName('span')[0] : null;

            // 子节点-icon
            const iconDiv = itemDiv.getElementsByClassName('icon')[0];
            const iconUI = iconDiv ? iconDiv.getElementsByTagName('ui-icon')[0] : null;

            if (iconUI) iconUI['color'] = 'true';
            if (iconUI) iconUI.style.color = '';
            if (nameUI) nameUI.style.color = '';

            if (iconDiv) iconDiv.style.height = '100%';
            if (iconDiv) iconDiv.style.backgroundColor = '';
            if (nameDiv) nameDiv.style.backgroundColor = '';

            if (!isDirectory || !iconUI || !nameUI) return;

            if (assetUrl === 'db://assets/app') {
                iconUI['value'] = 'home';
                iconUI.removeAttribute('color');
                iconUI.style.color = 'sandybrown';
                nameUI.style.color = 'whitesmoke';
            }
            // app-global
            else if (assetUrl === 'db://assets/app-global') {
                iconUI['value'] = 'service';
                iconUI.removeAttribute('color');
                iconUI.style.color = 'deepskyblue';
                nameUI.style.color = 'whitesmoke';
            }
            else if (new RegExp('^db://assets/app-global/assetbundle/global-sound$').test(assetUrl)) {
                iconUI['value'] = 'music';
                iconUI.removeAttribute('color');
                iconUI.style.color = 'yellowgreen';
                nameUI.style.color = 'yellowgreen';
            }
            else if (new RegExp('^db://assets/app-global/assembly/global-view$').test(assetUrl)) {
                iconUI.removeAttribute('color');
                iconUI.style.color = 'orange';
                nameUI.style.color = 'orange';
            }
            else if (new RegExp('^db://assets/app-global/assetbundle/global-view$').test(assetUrl)) {
                iconUI.removeAttribute('color');
                iconUI.style.color = 'orange';
                nameUI.style.color = 'orange';
            }

            // app-module
            else if (assetUrl === 'db://assets/app-module') {
                iconUI['value'] = 'mini-game';
                iconUI.removeAttribute('color');
                iconUI.style.color = 'gold';
                nameUI.style.color = 'whitesmoke';
            }
            else if (assetFolderUrl === 'db://assets/app-module') {
                iconUI.removeAttribute('color');
                if (isExpand) {
                    iconUI.style.color = 'gold';
                    nameUI.style.color = 'whitesmoke';
                    iconDiv.style.backgroundColor = 'brown';
                    nameDiv.style.backgroundColor = 'brown';
                } else {
                    iconUI.style.color = 'gold';
                    nameUI.style.color = 'whitesmoke';
                    iconDiv.style.backgroundColor = '';
                    nameDiv.style.backgroundColor = '';
                }
            }
            else if (new RegExp('^db://assets/app-module/[a-zA-z0-9-]+/assetbundle/module-sound$').test(assetUrl)) {
                iconUI['value'] = 'music';
                iconUI.removeAttribute('color');
                iconUI.style.color = 'yellowgreen';
                nameUI.style.color = 'yellowgreen';
            }

            else if (new RegExp('^db://assets/app-module/[a-zA-z0-9-]+/assembly/module-view$').test(assetUrl)) {
                iconUI.removeAttribute('color');
                iconUI.style.color = 'orange';
                nameUI.style.color = 'orange';
            }
            else if (new RegExp('^db://assets/app-module/[a-zA-z0-9-]+/assetbundle/module-view$').test(assetUrl)) {
                iconUI.removeAttribute('color');
                iconUI.style.color = 'orange';
                nameUI.style.color = 'orange';
            }

            else if (assetUrl === 'db://assets/app-shared') {
                iconUI['value'] = 'export';
                iconUI.removeAttribute('color');
                iconUI.style.color = 'deepskyblue';
                nameUI.style.color = 'whitesmoke';
            }
        });
    }

    let retryCount = 0;
    const maxRetryCount = 10;

    function initAssetMark() {
        // 资源管理器窗口
        const assetDock = document.querySelector('#dock')?.shadowRoot?.
            querySelector('dock-layout dock-layout dock-groups dock-panels > panel-frame[name=assets]')?.shadowRoot?.
            querySelector('div > div.separate-box > div:nth-child(1) > section > ui-drag-area');

        if (!assetDock) {
            if (retryCount++ < maxRetryCount) {
                setTimeout(initAssetMark, 500);
            }
            return;
        }

        if (typeof MutationObserver === 'undefined') {
            setInterval(function () {
                updateAssetMark(assetDock);
            }, 50);
        } else {
            // 创建一个观察器实例并传入回调函数
            const observer = new MutationObserver(function () {
                updateAssetMark(assetDock);
            });

            // 开始观察已配置的目标节点（观察目标节点的子节点的变化）
            observer.observe(assetDock, { childList: true, subtree: true });

            // 你可以随时停止观察
            // observer.disconnect();
        }

        updateAssetMark(assetDock);
    }

    initAssetMark();
})();