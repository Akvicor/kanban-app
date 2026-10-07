import {app, BrowserWindow, ipcMain, net, type IpcMainEvent, type IpcMainInvokeEvent} from 'electron'
import {IpcChannel, type ConnectResult, type Locale, type PageInfo, type ServerProblem} from '../shared/ipc'
import type {ConfigStore} from './config/store'
import {normalizeServerAddress} from './server/address'
import {checkServer} from './server/health'
import {createLocalWindow, type LocalPage} from './window/local-window'
import {createMainWindow} from './window/main-window'

/**
 * 客户端的窗口流程：
 * - 有已保存的服务器地址时打开主窗口加载看板；没有时打开设置页；
 * - 主窗口加载失败时关闭主窗口，打开错误页，可以重试或更换地址；
 * - 设置页校验通过后保存地址，打开或切换主窗口。
 * 本地页面的 IPC 只接受来自本地窗口的调用。
 */
export class AppController {
  private mainWindow: BrowserWindow | null = null
  private localWindow: BrowserWindow | null = null
  private localPage: LocalPage = 'settings'
  private problem: ServerProblem | null = null

  constructor(
    private readonly config: ConfigStore,
    private readonly locale: Locale,
  ) {}

  /** 当前保存的服务器来源。 */
  serverOrigin(): string | null {
    return this.config.get().serverOrigin
  }

  /** 启动或 macOS 上点击 Dock 图标且没有窗口时调用。 */
  start(): void {
    const origin = this.serverOrigin()
    if (origin === null) this.showLocal('settings')
    else this.openMain(origin)
  }

  /** 让已有窗口回到前台（再次启动应用时）。 */
  focus(): void {
    const window = this.localWindow ?? this.mainWindow
    if (window === null) {
      this.start()
      return
    }
    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()
  }

  /** 菜单「更换服务器地址」。 */
  openSettings(): void {
    this.showLocal('settings')
  }

  registerIpc(): void {
    ipcMain.handle(IpcChannel.PageInfo, (event) => {
      this.assertLocal(event)
      return this.pageInfo()
    })
    ipcMain.handle(IpcChannel.Connect, (event, address: unknown) => {
      this.assertLocal(event)
      return this.connect(typeof address === 'string' ? address : '')
    })
    ipcMain.on(IpcChannel.Cancel, (event) => {
      if (!this.isLocal(event) || this.serverOrigin() === null) return
      this.closeLocal()
      if (this.mainWindow === null) this.start()
    })
    ipcMain.on(IpcChannel.Retry, (event) => {
      if (!this.isLocal(event)) return
      this.closeLocal()
      this.start()
    })
    ipcMain.on(IpcChannel.OpenSettings, (event) => {
      if (!this.isLocal(event)) return
      this.showLocal('settings')
    })
  }

  private pageInfo(): PageInfo {
    const origin = this.serverOrigin()
    return {
      locale: this.locale,
      version: app.getVersion(),
      origin,
      problem: this.localPage === 'error' ? this.problem : null,
      cancellable: this.localPage === 'settings' && origin !== null,
    }
  }

  private async connect(address: string): Promise<ConnectResult> {
    const origin = normalizeServerAddress(address)
    if (origin === null) return {ok: false, problem: 'invalid-address'}
    const result = await checkServer(origin, (input, init) => net.fetch(input, init))
    if (!result.ok) return result
    this.config.update({serverOrigin: result.origin})
    this.closeLocal()
    this.openMain(result.origin)
    return result
  }

  /** 打开主窗口加载服务器；已有主窗口时先关闭，按新地址重新创建，使导航和权限策略使用新的来源。 */
  private openMain(origin: string): void {
    this.closeMain()
    const window = createMainWindow(origin, this.config, {
      onLoadFailed: (problem) => {
        if (this.mainWindow !== window) return
        this.problem = problem
        this.closeMain()
        this.showLocal('error')
      },
    })
    window.on('closed', () => {
      if (this.mainWindow === window) this.mainWindow = null
    })
    this.mainWindow = window
  }

  private closeMain(): void {
    const window = this.mainWindow
    this.mainWindow = null
    if (window !== null && !window.isDestroyed()) window.close()
  }

  private showLocal(page: LocalPage): void {
    this.closeLocal()
    this.localPage = page
    const window = createLocalWindow(page)
    window.on('closed', () => {
      if (this.localWindow === window) this.localWindow = null
    })
    this.localWindow = window
  }

  private closeLocal(): void {
    const window = this.localWindow
    this.localWindow = null
    if (window !== null && !window.isDestroyed()) window.close()
  }

  private isLocal(event: IpcMainEvent | IpcMainInvokeEvent): boolean {
    return this.localWindow !== null && !this.localWindow.isDestroyed() && event.sender === this.localWindow.webContents
  }

  private assertLocal(event: IpcMainInvokeEvent): void {
    if (!this.isLocal(event)) throw new Error('IPC 调用只接受来自本地页面的请求')
  }
}
