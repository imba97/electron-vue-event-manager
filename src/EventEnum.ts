export type EventType = string

/**
 * 主进程事件类型
 */
export enum MainEventType {
  /**
   * 执行其他窗口的监听器
   */
  ExecuteOtherWindowsListener = 'ExecuteOtherWindowsListener',

  /**
   * 网络请求
   */
  NetworkRequest = 'NetworkRequest',

  /**
   * 返回
   */
  NetworkResponse = 'NetworkResponse'
}
