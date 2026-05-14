import { _decorator, Camera, Canvas, Component, director, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

const Group = { id: 'BaseView', name: 'Settings', displayOrder: -Infinity, style: 'section' };

export class Configuration {
    public static Canvas: Canvas;
    public static Camera: Camera;
    public static UserInterface: Node;
    public static UIShadow: Prefab;
    public static UILoading: Prefab;
    public static UIToast: Prefab;
}

@ccclass('BaseMain')
export class BaseMain extends Component {
    @property({ group: Group, type: Prefab })
    private UIToast: Prefab = null;
    @property({ group: Group, type: Prefab })
    private UIShadow: Prefab = null;
    @property({ group: Group, type: Prefab })
    private UILoading: Prefab = null;
    @property({ group: Group, type: Node })
    private UserInterface: Node = null;

    /**
     * 初始化
     */
    protected setup() {
        director.addPersistRootNode(this.node);

        // 初始化全局配置
        Configuration.Camera = this.UserInterface.getComponent(Camera);
        Configuration.Canvas = this.getComponent(Canvas);
        Configuration.UserInterface = this.UserInterface;
        Configuration.UILoading = this.UILoading;
        Configuration.UIShadow = this.UIShadow;
        Configuration.UIToast = this.UIToast;
    }
}