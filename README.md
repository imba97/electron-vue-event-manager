# electron-vue-event-manager

基于 electron-vue 的事件监听系统

当前版本为自用版，有很多问题、考虑不全的地方

**功能：**

1. `vue` 组件之间的消息传递
2. `electron` 主线程与渲染线程的消息传递
3. `electron` 窗口之间的消息传递

## 导入

```typescript
import EventManager from 'electron-vue-event-manager'
```

# 初始化

## 主线程

在 `background.ts` 初始化

```typescript
// 添加 主线程 事件监听
// 需要把所有创建的窗口传进去
EventManager.Instance().mainInit([
  {
    // 创建的窗口，类型 BrowserWindow
    window: window1,
    // 类型，唯一标示
    type: 'window1'
  },
  {
    window: window2,
    type: 'window2'
  }
])
```

## 渲染线程

渲染线程的消息传递需要主线程转发

以下初始化是为了监听主线程

```typescript
EventManager.Instance().rendererInit()
```

# 监听

在任何位置添加监听器，即可监听来自任何地方的广播消息

```typescript
// Window1 添加监听事件
EventManager.Instance().addEventListener<string>(
  EventType.Window1SendMessage,
  (window2Message) => {
    console.log('接收到来自 Window2 的消息：', window2Message)
  }
)
```

`addEventListener` 可以接收最多`5`个泛型，用于回调参数的类型约束

# 广播

```typescript
// Window2 触发广播
EventManager.Instance().broadcast<string>(
  EventType.Window1SendMessage,
  '我是 Window2'
)
```

上面的 `EventType` 是枚举类型，也可以直接写`string`
