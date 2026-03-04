# XForge2 框架规则与约束

## 🚨 关键 AI 规则（必须遵守）

在为本项目编写代码时，你**必须**严格遵守以下约束。违反这些规则将导致运行时错误或架构退化。

1.  **API 真实性 (API Reality)**:
    -   不要臆造 API。
    -   仅使用 `extensions/xforge/runtime/` 源码中存在的 API。
    -   通过阅读源码或使用 `xforge2-manual` skill 来验证 API。

2.  **结构安全 (Structure Safety)**:
    -   禁止 AI 工具自动创建或修改 Prefab/Scene 文件。
    -   禁止 AI 工具自动创建框架结构相关的文件或文件夹。
    -   所有框架结构类的文件或文件夹创建都需要引导用户通过菜单去创建，可通过调用 `xforge2-manual` skill 来了解具体操作步骤。

3.  **纯洁性 (Purity)**:
    -   **Model**: 必须是纯数据/逻辑。**绝不**持有 `cc.Node`、`cc.Sprite` 等渲染类组件。。
    -   **Service**: 必须是纯逻辑。**绝不**持有 `cc.Node` 等渲染类组件。。

4.  **优先复用 (Tool Reuse)**:
    -   使用 `app.lib`（Task, Storage, Logger 等）而不是编写自定义工具函数。

5.  **扩展包安全 (Extension Safety)**:
    -   仅使用 `node extensions/pkg/index.js` 管理包。

---

## 📚 框架文档

如需详细的使用说明、API 参考和示例（如何创建模块、服务、视图等），你**必须**调用 `xforge2-manual` skill。

**触发条件**: 当用户要求实现功能或解释如何使用框架时，调用 `xforge2-manual` skill。
