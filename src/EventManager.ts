import { ipcMain, ipcRenderer } from 'electron'
import SingletonBase from './base/Singleton'

import { EventType, MainEventType } from './EventEnum'
import {
  Callback,
  Callback1,
  Callback2,
  Callback3,
  Callback4,
  Callback5
} from './Callback'
import _ from 'lodash'
import { IBrowserWindow } from './EventInterface'

type EventFunction = (...args: any[]) => any

/**
 * 是否是主线程
 */
const IS_MAIN = ipcMain !== undefined

export default class EventManager extends SingletonBase {
  private _listener: Map<EventType, EventFunction[]> = new Map()

  private _windows: IBrowserWindow[] = []

  public mainInit(windows: IBrowserWindow[]) {
    this._windows = windows

    ipcMain.on(
      MainEventType.ExecuteOtherWindowsListener,
      (_event, type: EventType, ...args) => {
        this._executeMain(type, ...args)
      }
    )
  }

  public rendererInit() {
    ipcRenderer.on(
      MainEventType.ExecuteOtherWindowsListener,
      (_, _senderType: string, type: EventType, ...args) => {
        console.log('渲染线程接收 Send', args)
        this._execute(type, true, ...args)
      }
    )
  }

  private _addEventListener(type: EventType, cb: EventFunction) {
    console.log(IS_MAIN ? '主线程添加监听器' : '渲染线程添加监听器')

    if (!this._listener.has(type)) {
      this._listener.set(type, new Array<EventFunction>())
    }

    this._listener.get(type)!.push(cb as EventFunction)
    // 添加进程对应的事件

    if (IS_MAIN) {
      ipcMain.on(type, (_, ...args) => {
        cb(...args)
      })
    } else {
      ipcRenderer.on(type, (_, ...args) => {
        cb(...args)
      })
    }
  }

  private _removeEventListener(type: EventType, cb: EventFunction) {
    if (!this._listener.has(type)) {
      throw new Error('没有事件类型')
    }

    const cbs = this._listener.get(type)

    if (!cbs) {
      return
    }

    const index = cbs.indexOf(cb as EventFunction)

    if (~index) {
      cbs.splice(index, 1)
      this._listener.set(type, cbs)
      // 移除进程对应的事件
      ;(IS_MAIN ? ipcMain : ipcRenderer).off(type, cb)
    }
  }

  public addEventListener(type: EventType, cb: Callback): void
  public addEventListener<Arg1>(type: EventType, cb: Callback1<Arg1>): void
  public addEventListener<Arg1, Arg2>(
    type: EventType,
    cb: Callback2<Arg1, Arg2>
  ): void
  public addEventListener<Arg1, Arg2, Arg3>(
    type: EventType,
    cb: Callback3<Arg1, Arg2, Arg3>
  ): void
  public addEventListener<Arg1, Arg2, Arg3, Arg4>(
    type: EventType,
    cb: Callback4<Arg1, Arg2, Arg3, Arg4>
  ): void
  public addEventListener<Arg1, Arg2, Arg3, Arg4, Arg5>(
    type: EventType,
    cb: Callback5<Arg1, Arg2, Arg3, Arg4, Arg5>
  ) {
    this._addEventListener(type, cb)
  }

  public removeEventListener(type: EventType, cb: Callback): void
  public removeEventListener<Arg1>(type: EventType, cb: Callback1<Arg1>): void
  public removeEventListener<Arg1, Arg2>(
    type: EventType,
    cb: Callback2<Arg1, Arg2>
  ): void
  public removeEventListener<Arg1, Arg2, Arg3>(
    type: EventType,
    cb: Callback3<Arg1, Arg2, Arg3>
  ): void
  public removeEventListener<Arg1, Arg2, Arg3, Arg4>(
    type: EventType,
    cb: Callback4<Arg1, Arg2, Arg3, Arg4>
  ): void
  public removeEventListener<Arg1, Arg2, Arg3, Arg4, Arg5>(
    type: EventType,
    cb: Callback5<Arg1, Arg2, Arg3, Arg4, Arg5>
  ) {
    this._removeEventListener(type, cb)
  }

  public broadcast(
    type: EventType,
    arg1?: undefined,
    arg2?: undefined,
    arg3?: undefined,
    arg4?: undefined,
    arg5?: undefined
  ): void
  public broadcast<Arg1>(
    type: EventType,
    arg1: Arg1,
    arg2?: undefined,
    arg3?: undefined,
    arg4?: undefined,
    arg5?: undefined
  ): void
  public broadcast<Arg1, Arg2>(
    type: EventType,
    arg1: Arg1,
    arg2: Arg2,
    arg3?: undefined,
    arg4?: undefined,
    arg5?: undefined
  ): void
  public broadcast<Arg1, Arg2, Arg3>(
    type: EventType,
    arg1: Arg1,
    arg2: Arg2,
    arg3: Arg3,
    arg4?: undefined,
    arg5?: undefined
  ): void
  public broadcast<Arg1, Arg2, Arg3, Arg4>(
    type: EventType,
    arg1: Arg1,
    arg2: Arg2,
    arg3: Arg3,
    arg4: Arg4,
    arg5?: undefined
  ): void
  public broadcast<Arg1, Arg2, Arg3, Arg4, Arg5>(
    type: EventType,
    arg1: Arg1,
    arg2: Arg2,
    arg3: Arg3,
    arg4: Arg4,
    arg5: Arg5
  ) {
    const args = [arg1, arg2, arg3, arg4, arg5].filter(
      (arg) => arg !== undefined
    )

    // 执行自己的监听器
    this._execute(type, false, ...args)

    // 是主线程则向其他渲染线程发送消息
    if (IS_MAIN) {
      this._executeMain(type, ...args)
    } else {
      // 是渲染线程则让渲染线程通过主线程转发到其他渲染线程
      ipcRenderer.send(MainEventType.ExecuteOtherWindowsListener, type, ...args)
    }
  }

  private _execute(type: EventType, isMainSend: boolean, ...args: any[]) {
    console.log(type, 'execute')

    const callback = this._listener.get(type)
    if (callback) {
      callback.forEach((cb) => {
        cb(...args)
      })
    }

    // 不是主线程 && 不是主线程调用的广播
    if (!IS_MAIN && !isMainSend) {
      ipcRenderer.send(type, ...args)
    }
  }

  private _executeMain(type: EventType, ...args: any[]) {
    console.log(type, 'executeMain')
    _.forEach(this._windows, (item) => {
      item.window.webContents.send(
        MainEventType.ExecuteOtherWindowsListener,
        item.type,
        type,
        ...args
      )
    })
  }
}
