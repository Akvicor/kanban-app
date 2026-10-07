import type {Session} from 'electron'
import {isPermissionAllowed} from './permissions'

/** User-Agent 中客户端标记的名称；看板前端据此把设备名显示为「桌面客户端 · 系统」。 */
export const USER_AGENT_MARKER = 'KanbanApp'

/**
 * 为加载看板页面的会话设置客户端标记和权限策略。
 * getServerOrigin 返回当前保存的服务器来源，更换服务器后权限判断随之变化。
 */
export function applySessionPolicy(session: Session, version: string, getServerOrigin: () => string | null): void {
  session.setUserAgent(`${session.getUserAgent()} ${USER_AGENT_MARKER}/${version}`)
  session.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    callback(isPermissionAllowed(permission, details.requestingUrl, getServerOrigin()))
  })
  session.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    return isPermissionAllowed(permission, requestingOrigin, getServerOrigin())
  })
}
