import {contextBridge, ipcRenderer} from 'electron'
import {IpcChannel, type ConnectResult, type DesktopApi, type PageInfo} from '../shared/ipc'

/**
 * 本地页面（服务器设置页、错误页）的 preload：以 window.kanbanApp 暴露最少的接口。
 * 只有本地窗口加载它，远程的看板页面没有这些接口。
 */
const api: DesktopApi = {
  pageInfo: () => ipcRenderer.invoke(IpcChannel.PageInfo) as Promise<PageInfo>,
  connect: (address) => ipcRenderer.invoke(IpcChannel.Connect, address) as Promise<ConnectResult>,
  cancel: () => ipcRenderer.send(IpcChannel.Cancel),
  retry: () => ipcRenderer.send(IpcChannel.Retry),
  openSettings: () => ipcRenderer.send(IpcChannel.OpenSettings),
}

contextBridge.exposeInMainWorld('kanbanApp', api)
