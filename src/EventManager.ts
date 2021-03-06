import { app, ipcMain, ipcRenderer } from 'electron'
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

import axios, { AxiosPromise, AxiosRequestConfig } from 'axios'

type EventFunction = (...args: any[]) => any

/**
 * 是否是主线程
 */
const IS_MAIN = ipcMain !== undefined

export default class EventManager extends SingletonBase {
  private _listener: Map<EventType, EventFunction[]> = new Map()
  private _networkListener: Map<
    number,
    { resolve: (arg: any) => void; reject: (arg: any) => void }
  > = new Map()

  private _windows: IBrowserWindow[] = []

  public mainInit(windows: IBrowserWindow[]) {
    this._windows = windows

    app.on('will-quit', () => {
      ;(this as any).instance = null
    })

    // 在其他窗口执行事件回调
    ipcMain.on(
      MainEventType.ExecuteOtherWindowsListener,
      (_event, type: EventType, ...args) => {
        this._executeMain(type, ...args)
      }
    )

    // 网络请求封装
    ipcMain.on(
      MainEventType.NetworkRequest,
      (event, id: number, options: AxiosRequestConfig) => {
        console.log('网络请求', options)
        axios(options).then((response) => {
          event.sender.send(MainEventType.NetworkResponse, id, response.data)
        })
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

    ipcRenderer.on(
      MainEventType.NetworkResponse,
      (_, id: number, response: any) => {
        const promise = this._networkListener.get(id)
        promise.resolve(response)
        this._networkListener.delete(id)
        // TODO: 异常处理
      }
    )
  }

  /**
   * 发送网络请求
   * @param options 参数
   */
  public sendRequest(options: AxiosRequestConfig<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('sendRequest', options)

      if (IS_MAIN) {
        axios(options)
          .then((response) => {
            resolve(response.data)
          })
          .catch(reject)
        return
      }

      const id = _.random(0, 99999999)
      // TODO: id 用随机字符+时间戳
      if (!this._networkListener.has(id)) {
        this._networkListener.set(id, {
          resolve,
          reject
        })
      }

      ipcRenderer.send(MainEventType.NetworkRequest, id, options)
    })
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

  /**
   * 添加事件监听器
   * @param type 事件类型
   * @param cb 回调函数
   */
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

  /**
   * 移除事件监听器
   * @param type 事件类型
   * @param cb 回调函数
   */
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

  /**
   * 事件广播
   * @param type 事件类型
   * @param arg1 参数 1
   * @param arg2 参数 2
   * @param arg3 参数 3
   * @param arg4 参数 4
   * @param arg5 参数 5
   */
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

  /**
   * 执行渲染进程回调
   * @param type 事件类型
   * @param isMainSend 是否是主线程发送
   * @param args 参数
   */
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

  /**
   * 执行主进程回调
   * @param type 事件类型
   * @param args 参数
   */
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
