import {BrowserWindow} from 'electron'
import {join} from 'node:path'

/** 本地页面：服务器设置页和错误页，都是客户端自带的静态页面。 */
export type LocalPage = 'settings' | 'error'

/**
 * 创建显示本地页面的窗口。
 * 只有这个窗口加载 preload（经 contextBridge 暴露设置服务器地址等接口），页面不会离开本地文件，
 * 也不会打开新窗口；不加载任何远程内容。
 */
export function createLocalWindow(page: LocalPage): BrowserWindow {
  const window = new BrowserWindow({
    width: 520,
    height: 560,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    icon: join(__dirname, 'icon.png'),
    backgroundColor: '#F7F8FA',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
    },
  })
  window.setMenuBarVisibility(false)
  window.once('ready-to-show', () => window.show())
  window.webContents.on('will-navigate', (event) => event.preventDefault())
  window.webContents.setWindowOpenHandler(() => ({action: 'deny'}))
  window.webContents.on('will-attach-webview', (event) => event.preventDefault())
  window.loadFile(join(__dirname, 'pages', `${page}.html`)).catch(() => undefined)
  return window
}
