import {app, BrowserWindow, dialog, Menu, type BaseWindow, type MenuItemConstructorOptions, type WebContents} from 'electron'
import type {Locale} from '../shared/ipc'
import {message} from './i18n'

/** 菜单触发的客户端操作。 */
export interface MenuActions {
  changeServer(): void
}

/**
 * Windows、Linux 上显示/隐藏菜单栏的快捷键，也是客户端在这两个平台上自带的唯一快捷键：
 * 其余按键都留给看板网页（看板的快捷键可由用户自定义），菜单功能通过点击使用。
 */
const TOGGLE_MENU_BAR_ACCELERATOR = 'Ctrl+Shift+M'

/** 每次放大、缩小改变的缩放级别，与 Electron 内置 zoomIn、zoomOut 角色相同。 */
const ZOOM_STEP = 0.5

/** 关于对话框：显示客户端、Electron 和 Chromium 的版本。 */
function showAbout(locale: Locale): void {
  void dialog.showMessageBox({
    type: 'info',
    title: message(locale, 'about'),
    message: message(locale, 'appName'),
    detail: message(locale, 'aboutDetail', {
      version: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
    }),
  })
}

/** 菜单点击时所在窗口的网页；窗口不是 BrowserWindow 或没有窗口时为 null。 */
function webContentsOf(window: BaseWindow | undefined): WebContents | null {
  return window instanceof BrowserWindow ? window.webContents : null
}

/**
 * 视图菜单。刷新、缩放、全屏用 click 实现而不使用 Electron 的菜单角色：
 * 角色会自动注册 Ctrl+R、Ctrl+加号等快捷键，抢在看板网页之前处理这些按键。
 * 开发者工具只在未打包的开发运行中提供，保留角色自带的快捷键便于调试。
 */
function viewMenu(locale: Locale): MenuItemConstructorOptions[] {
  const zoomBy = (window: BaseWindow | undefined, delta: number | null) => {
    const contents = webContentsOf(window)
    if (contents !== null) contents.zoomLevel = delta === null ? 0 : contents.zoomLevel + delta
  }
  return [
    {label: message(locale, 'reload'), click: (_item, window) => webContentsOf(window)?.reload()},
    {label: message(locale, 'forceReload'), click: (_item, window) => webContentsOf(window)?.reloadIgnoringCache()},
    ...(app.isPackaged ? [] : [{role: 'toggleDevTools'} satisfies MenuItemConstructorOptions]),
    {type: 'separator'},
    {label: message(locale, 'resetZoom'), click: (_item, window) => zoomBy(window, null)},
    {label: message(locale, 'zoomIn'), click: (_item, window) => zoomBy(window, ZOOM_STEP)},
    {label: message(locale, 'zoomOut'), click: (_item, window) => zoomBy(window, -ZOOM_STEP)},
    {type: 'separator'},
    {label: message(locale, 'toggleFullScreen'), click: (_item, window) => window?.setFullScreen(!window.isFullScreen())},
  ]
}

/**
 * Windows、Linux 的编辑菜单。复制、粘贴等快捷键由 Chromium 在网页中直接处理，
 * 菜单只显示快捷键文字（registerAccelerator: false），不再注册一遍，按键先交给看板网页。
 */
function editMenu(): MenuItemConstructorOptions[] {
  const item = (role: MenuItemConstructorOptions['role']): MenuItemConstructorOptions => ({role, registerAccelerator: false})
  return [item('undo'), item('redo'), {type: 'separator'}, item('cut'), item('copy'), item('paste'), item('delete'), {type: 'separator'}, item('selectAll')]
}

/**
 * 设置应用菜单。
 * - macOS：菜单在屏幕顶部，应用菜单承载「关于」「更换服务器地址」「退出」；保留系统约定的快捷键
 *   （Cmd+Q、Cmd+H、编辑菜单的 Cmd+C 等、窗口菜单的 Cmd+M 等），macOS 的网页复制粘贴依赖编辑菜单。
 * - Windows、Linux：菜单栏在窗口内，主窗口默认隐藏，按 Ctrl+Shift+M 显示或隐藏；
 *   「更换服务器地址」「退出」在「文件」菜单，「关于」在「帮助」菜单。
 */
export function installMenu(locale: Locale, actions: MenuActions): void {
  const changeServer: MenuItemConstructorOptions = {label: message(locale, 'changeServer'), click: () => actions.changeServer()}
  const about: MenuItemConstructorOptions = {label: message(locale, 'about'), click: () => showAbout(locale)}

  const template: MenuItemConstructorOptions[] =
    process.platform === 'darwin'
      ? [
          {
            label: message(locale, 'appName'),
            submenu: [about, {type: 'separator'}, changeServer, {type: 'separator'}, {role: 'services'}, {type: 'separator'}, {role: 'hide'}, {role: 'hideOthers'}, {role: 'unhide'}, {type: 'separator'}, {role: 'quit'}],
          },
          {label: message(locale, 'menuEdit'), role: 'editMenu'},
          {label: message(locale, 'menuView'), submenu: viewMenu(locale)},
          {label: message(locale, 'menuWindow'), role: 'windowMenu'},
        ]
      : [
          {label: message(locale, 'menuFile'), submenu: [changeServer, {type: 'separator'}, {label: message(locale, 'quit'), click: () => app.quit()}]},
          {label: message(locale, 'menuEdit'), submenu: editMenu()},
          {
            label: message(locale, 'menuView'),
            submenu: [
              ...viewMenu(locale),
              {type: 'separator'},
              {
                label: message(locale, 'toggleMenuBar'),
                accelerator: TOGGLE_MENU_BAR_ACCELERATOR,
                click: (_item, window) => window?.setMenuBarVisibility(!window.isMenuBarVisible()),
              },
            ],
          },
          {label: message(locale, 'menuHelp'), submenu: [about]},
        ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
