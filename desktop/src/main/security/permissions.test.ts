import {describe, expect, it} from 'vitest'
import {isPermissionAllowed} from './permissions'

const origin = 'https://kanban.example.com'

describe('isPermissionAllowed', () => {
  it('服务器页面可以写剪贴板和全屏', () => {
    expect(isPermissionAllowed('clipboard-sanitized-write', 'https://kanban.example.com/board/1', origin)).toBe(true)
    expect(isPermissionAllowed('fullscreen', 'https://kanban.example.com/', origin)).toBe(true)
  })

  it('其他权限一律拒绝', () => {
    for (const permission of ['media', 'geolocation', 'notifications', 'clipboard-read', 'openExternal', 'midi']) {
      expect(isPermissionAllowed(permission, 'https://kanban.example.com/', origin)).toBe(false)
    }
  })

  it('其他来源、本地页面和未设置服务器时拒绝', () => {
    expect(isPermissionAllowed('fullscreen', 'https://evil.example.com/', origin)).toBe(false)
    expect(isPermissionAllowed('fullscreen', 'file:///app/pages/settings.html', origin)).toBe(false)
    expect(isPermissionAllowed('fullscreen', 'https://kanban.example.com/', null)).toBe(false)
    expect(isPermissionAllowed('fullscreen', '', origin)).toBe(false)
  })
})
