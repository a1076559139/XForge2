export function load() { }

export function unload() { }

// 在其他扩展脚本中，我们可以使用如下代码调用 rotateCamera 函数
// const options: ExecuteSceneScriptMethodOptions = {
//     name: scene.ts 所在的扩展包名, 如: App,
//     method: scene.ts 中定义的方法, 如: rotateCamera,
//     args: 参数，可选, 只传递json
// };
// const result = await Editor.Message.request('scene', 'execute-scene-script', options);
export const methods = {
    async createPrefab(name: string, fileUrl: string) {
        const { Node, UITransform, Widget, js, Layers } = require('cc');

        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;

        while (true) {
            const result = js.getClassByName(name);
            if (result) break;

            await new Promise((next) => {
                setTimeout(next, 100);
            });
        }

        const com = node.addComponent(name);
        com.resetInEditor && com.resetInEditor();

        node.addComponent(UITransform);
        const widget = node.addComponent(Widget);
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.isAlignTop = true;
        widget.top = 0;
        widget.left = 0;
        widget.right = 0;
        widget.bottom = 0;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;

        const info = cce.Prefab.generatePrefabDataFromNode(node) as any;
        node.destroy();

        return Editor.Message.request('asset-db', 'create-asset', fileUrl, info.prefabData || info);
    },
    async createScene(name: string, fileUrl: string) {
        const { SceneAsset, Scene, Node, js, Layers, Canvas, Camera, Color, Label } = require('cc');

        while (true) {
            const result = js.getClassByName(name);
            if (result) break;

            await new Promise((next) => {
                setTimeout(next, 100);
            });
        }

        const scene = new Scene(name);

        // 根节点
        const rootNode = new Node(name);
        rootNode.layer = Layers.Enum.DEFAULT;
        rootNode.parent = scene;

        const canvasComp = rootNode.addComponent(Canvas);

        // 相机
        const cameraNode = new Node('Camera');
        cameraNode.layer = Layers.Enum.DEFAULT;
        cameraNode.parent = rootNode;

        const cameraComp = cameraNode.addComponent(Camera);
        cameraComp.projection = Camera.ProjectionType.ORTHO;
        cameraComp.visibility = Layers.Enum.DEFAULT;
        cameraComp.clearColor = new Color(0, 0, 0, 255);
        cameraComp.clearFlags = Camera.ClearFlag.SOLID_COLOR;

        canvasComp.cameraComponent = cameraComp;
        canvasComp.alignCanvasWithScreen = true;

        // 文本
        const label = new Node('Label');
        label.parent = rootNode;
        label.addComponent(Label).string = '我是一个Label';

        // 灯光
        // const light = new Node('Light');
        // light.addComponent(DirectionalLight);
        // light.layer = Layers.Enum.DEFAULT;
        // light.parent = node;

        // hud
        // const hud = new Node('HUD');
        // hud.addComponent(RenderRoot2D);
        // hud.parent = node;

        // 脚本
        const com = rootNode.addComponent(name);
        com.resetInEditor && com.resetInEditor();

        // 序列化
        const sceneAsset = new SceneAsset();
        sceneAsset.scene = scene;
        const info = EditorExtends.serialize(sceneAsset);

        // 清理
        rootNode.destroy();
        scene.destroy();
        sceneAsset.destroy();

        return Editor.Message.request('asset-db', 'create-asset', fileUrl, info);
    },
};