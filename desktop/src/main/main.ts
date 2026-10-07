import {app, BrowserWindow, session} from 'electron'
import {join} from 'node:path'
import {ConfigStore} from './config/store'
import {AppController} from './controller'
import {resolveLocale} from './i18n'
import {installMenu} from './menu'
import {applySessionPolicy} from './security/session'

/**
 * 桌面客户端入口：单实例运行，启动后按已保存的服务器地址打开看板，没有地址时打开设置页。
 * Windows、Linux 上关闭全部窗口即退出；macOS 关闭窗口不退出，点击 Dock 图标重新打开。
 */
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  let controller: AppController | null = null

  app.on('second-instance', () => controller?.focus())

  app.whenReady().then(() => {
    const config = new ConfigStore(join(app.getPath('userData'), 'config.json'))
    const locale = resolveLocale(app.getLocale())
    const appController = new AppController(config, locale)
    controller = appController
    applySessionPolicy(session.defaultSession, app.getVersion(), () => appController.serverOrigin())
    appController.registerIpc()
    installMenu(locale, {changeServer: () => appController.openSettings()})
    appController.start()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) appController.start()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
