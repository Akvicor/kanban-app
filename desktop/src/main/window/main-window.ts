import {BrowserWindow, screen, shell} from 'electron'
import {join} from 'node:path'
import type {ServerProblem} from '../../shared/ipc'
import type {ConfigStore} from '../config/store'
import {classifyFetchError} from '../server/health'
import {navigationTarget} from '../security/navigation'
import {MIN_WINDOW_SIZE, restoreBounds} from './bounds'

/** Chromium 中导航被取消（例如被新的导航替代）的错误码，不算加载失败。 */
const ERR_ABORTED = -3

/** 主窗口的事件回调。 */
export interface MainWindowEvents {
  /** 服务器页面加载失败（无法连接、证书无效等）。 */
  onLoadFailed(problem: ServerProblem): void
}

/** 把站外地址交给系统浏览器；只会传入 http/https 地址。 */
function openExternal(url: string): void {
  void shell.openExternal(url)
}

/**
 * 创建加载看板页面的主窗口。
 * 窗口不加载 preload，页面运行在沙箱中，只能停留在服务器来源内：
 * 站外 http/https 地址交给系统浏览器，其他协议忽略，新窗口一律不在客户端中打开。
 */
export function createMainWindow(serverOrigin: string, config: ConfigStore, events: MainWindowEvents): BrowserWindow {
  const saved = config.get().window
  const bounds = restoreBounds(
    saved,
    screen.getAllDisplays().map((display) => display.workArea),
  )
  const window = new BrowserWindow({
    ...bounds,
    minWidth: MIN_WINDOW_SIZE.width,
    minHeight: MIN_WINDOW_SIZE.height,
    show: false,
    icon: join(__dirname, 'icon.png'),
    backgroundColor: '#F7F8FA',
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
    },
  })
  // Windows、Linux 的菜单栏在窗口内，默认隐藏，由菜单中的 Ctrl+Shift+M 显示或隐藏（见 menu.ts）。
  // 不使用 autoHideMenuBar：它在单独按下 Alt 时弹出菜单栏，会与窗口管理器的 Alt 组合键冲突。
  // macOS 的菜单在屏幕顶部，此调用不起作用。
  window.setMenuBarVisibility(false)
  if (saved?.maximized) window.maximize()
  window.once('ready-to-show', () => window.show())

  const {webContents} = window
  const guard = (event: Electron.Event, url: string) => {
    const target = navigationTarget(url, serverOrigin)
    if (target === 'stay') return
    event.preventDefault()
    if (target === 'external') openExternal(url)
  }
  webContents.on('will-navigate', (event) => guard(event, event.url))
  webContents.on('will-redirect', (event) => guard(event, event.url))
  webContents.setWindowOpenHandler(({url}) => {
    const target = navigationTarget(url, serverOrigin)
    if (target === 'stay') loadQuietly(window, url)
    else if (target === 'external') openExternal(url)
    return {action: 'deny'}
  })
  webContents.on('will-attach-webview', (event) => event.preventDefault())
  webContents.on('did-fail-load', (_event, errorCode, errorDescription, _url, isMainFrame) => {
    if (!isMainFrame || errorCode === ERR_ABORTED) return
    events.onLoadFailed(classifyFetchError(new Error(errorDescription)))
  })

  trackWindowState(window, config)

  loadQuietly(window, serverOrigin + '/')
  return window
}

/** 窗口移动或调整大小后，等这段时间内没有新的变化再保存，避免拖动时频繁写文件。 */
const SAVE_STATE_DELAY_MS = 500

/**
 * 保存主窗口的位置、大小和最大化状态。
 * 窗口在移动、调整大小、最大化后保存，关闭时再保存一次；
 * 网页调用 window.close() 关闭窗口时不触发 close 事件，所以不能只在关闭时保存。
 */
function trackWindowState(window: BrowserWindow, config: ConfigStore): void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const save = () => {
    clearTimeout(timer)
    timer = undefined
    if (window.isDestroyed() || window.isMinimized()) return
    const {x, y, width, height} = window.getNormalBounds()
    config.update({window: {x, y, width, height, maximized: window.isMaximized()}})
  }
  const scheduleSave = () => {
    clearTimeout(timer)
    timer = setTimeout(save, SAVE_STATE_DELAY_MS)
  }
  window.on('move', scheduleSave)
  window.on('resize', scheduleSave)
  window.on('maximize', scheduleSave)
  window.on('unmaximize', scheduleSave)
  window.on('close', save)
  window.on('closed', () => clearTimeout(timer))
}

/** 加载地址；加载失败由 did-fail-load 统一处理，这里不再重复处理 Promise 的拒绝。 */
function loadQuietly(window: BrowserWindow, url: string): void {
  window.webContents.loadURL(url).catch(() => undefined)
}
