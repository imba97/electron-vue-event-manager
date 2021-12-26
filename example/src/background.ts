'use strict'

import { app, screen, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

import EventManager from 'electron-vue-event-manager'
import { EventType } from './base/Event/EventEnum'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  const width = screen.getPrimaryDisplay().workAreaSize.width * 0.8
  const height = screen.getPrimaryDisplay().workAreaSize.height / 2

  const window1 = new BrowserWindow({
    x: screen.getPrimaryDisplay().workAreaSize.width / 2 - width / 2,
    y: 0,
    width: width,
    height: height,
    title: 'Window1',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  const window2 = new BrowserWindow({
    x: screen.getPrimaryDisplay().workAreaSize.width / 2 - width / 2,
    y: screen.getPrimaryDisplay().workAreaSize.height - height,
    width: width,
    height: height,
    title: 'Window2',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // 添加 主线程 事件监听
  // 需要把所有创建的窗口传进去
  EventManager.Instance().mainInit([
    {
      window: window1,
      type: 'window1'
    },
    {
      window: window2,
      type: 'window2'
    }
  ])

  window2.on('close', () => {
    EventManager.Instance().broadcast(EventType.Window2BeforeClose)
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await window1.loadURL(
      `${process.env.WEBPACK_DEV_SERVER_URL as string}window1.html`
    )
    await window2.loadURL(
      `${process.env.WEBPACK_DEV_SERVER_URL as string}window2.html`
    )
    if (!process.env.IS_TEST) window1.webContents.openDevTools()
    if (!process.env.IS_TEST) window2.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    window1.loadURL('app://./window1.html')
    window2.loadURL('app://./window2.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e: any) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
