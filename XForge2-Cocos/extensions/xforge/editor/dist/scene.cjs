"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function load() {
}
function unload() {
}
const methods = {
  async createPrefab(name, fileUrl) {
    const { Node, UITransform, Widget, js, Layers } = require("cc");
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
    const info = cce.Prefab.generatePrefabDataFromNode(node);
    node.destroy();
    return Editor.Message.request("asset-db", "create-asset", fileUrl, info.prefabData || info);
  },
  async createScene(name, fileUrl) {
    const { SceneAsset, Scene, Node, js, Layers, Canvas, Camera, Color, Label } = require("cc");
    while (true) {
      const result = js.getClassByName(name);
      if (result) break;
      await new Promise((next) => {
        setTimeout(next, 100);
      });
    }
    const scene = new Scene(name);
    const rootNode = new Node(name);
    rootNode.layer = Layers.Enum.DEFAULT;
    rootNode.parent = scene;
    const canvasComp = rootNode.addComponent(Canvas);
    const cameraNode = new Node("Camera");
    cameraNode.layer = Layers.Enum.DEFAULT;
    cameraNode.parent = rootNode;
    const cameraComp = cameraNode.addComponent(Camera);
    cameraComp.projection = Camera.ProjectionType.ORTHO;
    cameraComp.visibility = Layers.Enum.DEFAULT;
    cameraComp.clearColor = new Color(0, 0, 0, 255);
    cameraComp.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    canvasComp.cameraComponent = cameraComp;
    canvasComp.alignCanvasWithScreen = true;
    const label = new Node("Label");
    label.parent = rootNode;
    label.addComponent(Label).string = "我是一个Label";
    const com = rootNode.addComponent(name);
    com.resetInEditor && com.resetInEditor();
    const sceneAsset = new SceneAsset();
    sceneAsset.scene = scene;
    const info = EditorExtends.serialize(sceneAsset);
    rootNode.destroy();
    scene.destroy();
    sceneAsset.destroy();
    return Editor.Message.request("asset-db", "create-asset", fileUrl, info);
  }
};
exports.load = load;
exports.methods = methods;
exports.unload = unload;
