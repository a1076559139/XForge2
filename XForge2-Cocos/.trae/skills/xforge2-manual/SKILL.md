---
name: xforge2-manual
description: Detailed documentation and usage guide for the XForge2 framework. Invoke when implementing features, checking API usage, or needing examples for modules/services/views.
---

# XForge2 Framework Manual

## 📚 1. 快速入门与目录结构

### 1.1 项目概览
- ⚡  **框架名称**: XForge2
- 🛠️ **引擎版本**: Cocos Creator 3.8
- 🧩 **核心路径**: `extensions/xforge/runtime/` (框架源码)
- 📦 **扩展路径**: `extensions/pkg/` (扩展包插件)
- 🎮 **业务路径**: `assets/` (游戏逻辑)

### 1.2 目录规范 (`assets/`)

项目采用模块化设计，主要分为三类目录：

| 目录 | 说明 | 关键文件/用途 |
| :--- | :--- | :--- |
| **`assets/app`** | 全局入口 | `app.ts` (静态数据), `main/Main.ts` (启动脚本) |
| **`assets/app-global`** | 全局模块 | 通用功能（如通用弹窗等）。代码在 `assembly/`，资源在 `assetbundle/`。 |
| **`assets/app-module`** | 功能模块 | 独立功能（如 `Home`, `Battle`）。代码在 `assembly/`，资源在 `assetbundle/`。 |
| **`assets/app-shared`** | 共享资源 | 存放全局通用的代码和资源。 |

#### 📁 模块内部结构与命名规范对比

全局模块 (`app-global`) 与功能模块 (`app-module`) 逻辑结构一致，但命名习惯有别：

| 层级/功能 | 全局模块 (`app-global`) | 功能模块 (`app-module`) |
| :--- | :--- | :--- |
| **物理路径** | `assets/app-global/` | `assets/app-module/[ModuleName]/` |
| **入口文件** | `assembly/AppGlobal.ts` | `assembly/AppModule[Name].ts` |
| **装饰器** | `@global` | `@module('[Name]')` |
| **继承父类** | `BaseModule` | `BaseModule` |
| **UI 组件** | `assembly/global-view/` | `assembly/module-view/` |
| **数据模型** | `assembly/global-model/` | `assembly/module-model/` |
| **业务逻辑** | `assembly/global-service/` | `assembly/module-service/` |
| **资源-View** | `assetbundle/global-view/` | `assetbundle/module-view/` |
| **资源-Sound**| `assetbundle/global-sound/` | `assetbundle/module-sound/` |

> 💡 **注意**: `app-module` 下需先创建模块名文件夹（如 `Home`），再建立 `assembly` 和 `assetbundle`。

### ⚠️ 1.3 AssetBundle 与脚本引用规范

模块下的 `assembly` (代码) 和 `assetbundle` (资源) 目录在 Cocos Creator 中都被配置为 **AssetBundle**。

-   **动态加载**: 这些 AssetBundle 是在运行时按需动态加载的。
-   **引用顺序限制**: **严禁**出现“先加载的 AssetBundle (如 `app-global`) 引用后加载的 AssetBundle (如 `app-module/Home`) 中的脚本”。
    -   ❌ **错误**: `AppGlobal` 引用 `HomeService`。
    -   ✅ **正确**: `HomeService` 引用 `AppGlobal` (下层引用上层)。

### 1.4 菜单工具

框架中的模块、服务、模型、视图、音乐音效等的创建都需要通过菜单工具来完成。
- **模块**: 菜单 -> XForge -> 创建 -> 选择Module或Global标签 -> 输入名字(Global不需要) -> 创建
- **服务**: 菜单 -> XForge -> 创建 -> 选中目标模块 -> 创建Service -> 输入名字 -> 创建
- **模型**: 菜单 -> XForge -> 创建 -> 选中目标模块 -> 创建Model -> 输入名字 -> 创建
- **视图**: 菜单 -> XForge -> 创建 -> 选中目标模块 -> 创建View -> 输入名字 -> 创建
- **音乐音效**: 菜单 -> XForge -> 创建 -> 选中目标模块 -> 创建Sound -> 输入名字 -> 创建

### 1.5 全局访问对象 (`app`)

框架导出了全局变量 `app` (`extensions/xforge/runtime/XForge.ts`)：
- **`app.lib`**: 内置工具箱。
- **`app.global`**: 访问全局模块实例 (单例)。
- **`app.loadModule` / `app.unloadModule`**: 加载/卸载功能模块。
- **注意**: `app` 对象**不提供**获取功能模块实例的 API。功能模块实例仅能在其内部组件中通过 `this.module` 访问，以保证解耦。

---

## 🚀 2. 启动流程

启动流程主要由 `assets/app/main/Main.ts` 控制。

**Main.ts 的核心职责**:
- 🛠️ **初始化**: 必须优先调用父类 `setup()` 方法进行框架初始化。
- 🖼️ **闪屏逻辑**: 处理启动画面的显示与销毁。
- 🔄 **热更新**: (可选) 检查并执行资源热更新。

**启动步骤示例**:

```typescript
protected start(): void {
    // 1. (必须) 框架初始化
    this.setup(); 

    // 2. 业务初始化流程 (推荐使用 task 队列，也可以直接 async/await)
    app.lib.task.createSync()
        .add(next => {
            // 加载全局模块
            app.loadGlobal({ onLoaded: next });
        })
        .add(next => {
            // 进入首屏模块
            app.loadModule({ name: 'Home', onLoaded: next });
        })
        .start(() => {
            // 3. 销毁闪屏
            this.splashScreen.destroy();
        });
}
```

> 💡 **提示**: 启动逻辑不强制要求写在 `start` 中，`onLoad` 或 `onEnable` 亦可，但务必保证在进行任何业务操作前先调用 `this.setup()`。

---

## 📦 3. 模块层 (Module)

模块是核心组织单位，所有业务逻辑都必须归属于某个模块。

### 3.1 模块定义与基类
所有模块入口脚本都继承自 `BaseModule`，并使用装饰器标记。

```typescript
// AppModuleHome.ts
import { BaseModule, module } from 'db://xforge/base/BaseModule';

@module('Home') // 功能模块
export class AppModuleHome extends BaseModule { ... }

// AppGlobal.ts
import { BaseModule, global } from 'db://xforge/base/BaseModule';

@global() // 全局模块
export class AppGlobal extends BaseModule { ... }
```

### 3.2 模块生命周期
*   `init(onLoaded, onError, onProgress)`: 模块初始化（异步）。
*   `onLoad()`: 模块加载完成。
*   `onUnload()`: 模块卸载。

### 3.3 ⚠️ 初始化最佳实践 (防黑屏)
为了避免模块切换过程中出现黑屏，**必须在 `init` 中调用 `ui.show` 并等待 `onShow` 回调后再执行 `onLoaded()`**。

```typescript
protected init(onLoaded: () => void, onError: () => void, onProgress: (result: number) => void): void {
    // ✅ 正确：在 init 中显示 UI，并等待 onShow 后再 onLoaded()
    this.ui.show({
        view: PageHome,
        onShow: onLoaded,
        onError: onError,
        onProgress: onProgress
    });
}
```

### 3.4 UI 管理 (`UIManager`)
模块提供了 `ui` 对象用于管理界面显示。

```typescript
// 打开界面
this.ui.show({
    view: PageHome,
    data: { id: 1 },
    onShow: () => console.log('Opened'),
    onHide: () => console.log('Closed')
});
```

### 3.5 音乐音效 (`SoundManager`)
模块提供了 `sound` 对象用于管理音频。

```typescript
// 播放 BGM (循环) -> assets/.../module-sound/music/bgm/main.mp3
this.sound.playMusic('bgm/main');

// 播放音效 (单次) -> assets/.../module-sound/effect/ui/click.mp3
this.sound.playEffect('ui/click');
```
*   路径相对于 `music/` 或 `effect/` 目录。

### 3.6 组件获取 (Model/Service)
在模块内部的 Model/Service/View 中，可以通过 `this.module` 获取当前模块的 Model 和 Service 实例。

```typescript
// 获取 Model
const gameModel = this.module.useModel(GameModel);

// 获取 Service
const gameService = this.module.useService(GameService);
```

### 3.7 模块访问约束
- **功能模块访问**: 仅能在 Model/Service/View 中通过 this.module 访问当前模块。因初始化顺序问题，在View的onLoad函数中无法使用this.module。
- **全局模块访问**: 通过 app.global 获取全局模块实例。
- **禁止**: 跨模块直接持有其他功能模块实例，或在模块外部获取功能模块实例。

---

## 💾 4. 数据层 (Model)

Model 负责数据的存储、运算和校验，推荐结合 `cc-store` 实现响应式更新。

### 4.1 定义与基类
继承自 `BaseModel`。如果需要响应式能力，需在构造函数返回 `createStore(this)`。

```typescript
// GameData.ts
import { BaseModel } from 'db://xforge/base/BaseModel';
import { IModelContext } from 'db://xforge/base/BaseModule';
import { createStore } from 'db://pkg/@gamex/cc-store';

export class GameData extends BaseModel {
    constructor(module: IModelContext) {
        super(module);
        return createStore(this); // 启用响应式
    }
    score = 0;
}
```

### 4.2 职责边界
- **持有模块数据**。
- **纯数据运算与校验**。
- **网络请求**: 允许发起纯数据类请求（如登录、配置拉取），并将结果存入自身。涉及复杂业务逻辑的请求仍建议由 Service 编排。
- **禁止**引入 `cc.Node` 等渲染类。

### 4.3 获取方式
在同模块的 Service/View 中：
```typescript
const gameData = this.module.useModel(GameData);
```

---

## ⚙️ 5. 服务层 (Service)

Service 是模块的“大脑”，负责业务逻辑编排和跨组件通信。

### 5.1 定义与基类
继承自 `BaseService`。

```typescript
import { BaseService } from 'db://xforge/base/BaseService';
export class GameService extends BaseService { ... }
```

### 5.2 职责边界
- **业务编排**: 协调 Model、Network、UI。
- **通信桥梁**: 负责模块内组件交互；**跨模块通信**需借助**全局模块 Service** 实现。
- **无状态**: 禁止持有 UI 组件引用 (`cc.Node`)。

### 5.3 消息通信 (`MessageBus`)
每个 Service 实例自带 `event` 属性。

**⚠️ 严格约束**:
1.  **同文件定义**: Event 类必须定义在 Service 类的同一个文件中。
2.  **私有化范围**: Service 只能发送（emit）它自己文件中定义的 Event。

```typescript
// GameService.ts
export class LoginEvent implements MessageBus.IEvent { ... } // 1. 定义

export class GameService extends BaseService {
    login() {
        this.event.emit(new LoginEvent()); // 2. 发送
    }
}
```

---

## 🎨 6. 视图层 (View)

View 负责界面展示和交互，推荐使用 MVVM 模式。

### 6.1 定义与基类
继承自 `BaseView`。

### 6.2 View 类型
*   **Page**: 场景级大界面 (对应资源: Scene)。
*   **Paper**: 页面拆分组件 (对应资源: Prefab)。
*   **Pop**: 业务弹窗 (对应资源: Prefab)。
*   **Top**: 顶层系统弹窗 (对应资源: Prefab)。

### 6.3 生命周期
*   **`static beforeShow(module, data)`**: (静态方法/异步) 视图显示前的预加载阶段。
*   **`onLoad()`**: 节点首次初始化时触发（引擎原生）。
*   **`onShow(data)`**: 视图每次显示时触发，接收外部传入的数据。
*   **`beforeHide()`**: 视图隐藏前触发。
*   **`onHide()`**: 视图隐藏后触发。

**限制：beforeShow中不要调用module.ui.show，避免show流程卡死**

### 6.4 数据绑定 (MVVM)
使用 `cc-store` 将 View 与 Model 绑定。

```typescript
// PageGame.ts
import { bindStore, watchStore, stopWatch } from 'db://pkg/@gamex/cc-store';

export class PageGame extends BaseView {
    onShow() {
        const gameData = this.module.useModel(GameData);
        // 属性绑定
        bindStore(this.label, 'string', () => `Score: ${gameData.score}`);
        // 逻辑监听
        watchStore(this.onScoreChange, this);
    }

    onHide() {
        // 停止监听（必须要手动停止watchStore，避免内存泄漏）
        stopWatch(this.onScoreChange, this);
    }
}
```

### 6.5 视图属性配置
在 View 的脚本组件中，可以配置以下重要属性：
- **hideMode**:
    - `ViewHideMode.Active`: 仅设置 `node.active = false`。保留节点内存，再次打开速度快。
    - `ViewHideMode.Destroy`: 销毁节点。节省内存，但重新打开需要重新实例化。
- **shade**: 
    - 为true时，会在 UI 下方自动生成一个黑色半透明遮罩（常用于 Pop 或 Top 类型）。

### 6.6 职责边界
*   处理交互、动画、数据绑定。
*   允许包含 UI 强相关的轻量业务逻辑。
*   重度逻辑应下沉至 Service。

---

## 🛠️ 7. 内置工具库 (Tools)

位于 `app.lib` 命名空间下。

*   **Storage**: `app.lib.storage.set('key', 'val')` / `setDay` (按天存储)。
*   **Task**: `app.lib.task.createSync()` 串行任务队列。
*   **Loader**: `app.lib.loader.loadBundleAsync` / `loadDir`。
*   **Logger**: `app.lib.logger.log/warn/error`。
*   **Debug**: `app.lib.debug.unobservable`。

---

## 📦 8. 扩展包管理

所有扩展包安装在 `extensions/pkg/`。

*   **安装**: `node extensions/pkg/index.js add <package-name>`
*   **引用**: `import ... from 'db://pkg/<package-name>'`

框架基于 npm 管理，但建议仅使用以下经过框架适配的官方扩展包：

#### 🔹 核心模块
| 包名 | 说明 |
| :--- | :--- |
| `@gamex/cc-expand` | 属性扩展: node.x、node.scaleX等 |
| `@gamex/cc-store` | 状态管理，数据变化自动更新UI |
| `@gamex/cc-request` | POST/GET网络请求 |
| `@gamex/cc-number` | 防内存挂数字类型 |
| `@gamex/cc-random` | 种子随机 |
| `@gamex/cc-astar` | A星巡路，支持4/6/8方向及路径平滑 |
| `@gamex/cc-quadtree` | 四叉碰撞树 |
| `@gamex/cc-sap` | SAP碰撞检测 |
| `@gamex/cc-sat` | SAT碰撞检测 |
| `@gamex/cc-rvo2` | 动态避障 |
| `@gamex/cc-ecs` | 实体-组件-系统 |
| `@gamex/cc-emath` | 精确数学运算，替换原生Math下三角函数运算并添加随机种子能力 |
| `@gamex/cc-decimal` | 定点数学运算 |
| `@gamex/cc-decimal-vec2` | 定点数二维向量 |
| `@gamex/cc-decimal-vec3` | 定点数三维向量 |
| `@gamex/cc-decimal-sat` | 定点数SAT碰撞检测 |
| `@gamex/cc-decimal-sap` | 定点数SAP碰撞检测 |
| `@gamex/cc-decimal-random` | 定点数随机 |
| `@gamex/cc-xml-parser` | XML解析 |
| `@gamex/cc-minisdk` | 小游戏SDK模块 |

#### 🔹 UI 组件
| 包名 | 说明 |
| :--- | :--- |
| `@gamex/cc-comp-toggle` | Toggle组件 |
| `@gamex/cc-comp-rich-text` | RichText组件 |
| `@gamex/cc-comp-spring-arm` | 弹簧臂组件 |
| `@gamex/cc-comp-animation` | Animation组件 |
| `@gamex/cc-comp-skeleton` | Spine组件 |
| `@gamex/cc-comp-skeletal-animation` | 3D骨骼动画组件 |
| `@gamex/cc-comp-movie-animation` | MovieClip播放组件 |
| `@gamex/cc-comp-frame-animation` | 帧动画播放组件 |
| `@gamex/cc-comp-rewardfly` | 奖励飞行动画组件 |

#### 🔹 UI 控件
| 包名 | 说明 |
| :--- | :--- |
| `@gamex/cc-ctrl-toast` | 消息提示控件 |
| `@gamex/cc-ctrl-rocker` | 摇杆控件 |
