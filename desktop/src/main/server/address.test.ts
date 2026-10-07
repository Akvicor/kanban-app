import {describe, expect, it} from 'vitest'
import {normalizeServerAddress} from './address'

describe('normalizeServerAddress', () => {
  it('只保留来源，去掉路径、查询参数和片段', () => {
    expect(normalizeServerAddress(' https://kanban.example.com/board/1?x=1#y ')).toBe('https://kanban.example.com')
    expect(normalizeServerAddress('http://192.168.1.5:3000/')).toBe('http://192.168.1.5:3000')
  })

  it('没写协议时按 https 补全', () => {
    expect(normalizeServerAddress('kanban.example.com')).toBe('https://kanban.example.com')
    expect(normalizeServerAddress('localhost:3000/path')).toBe('https://localhost:3000')
  })

  it('拒绝空地址、非 http(s) 协议和带账号密码的地址', () => {
    for (const input of ['', '   ', 'ftp://kanban.example.com', 'file:///etc/passwd', 'javascript://x', 'https://user:pass@kanban.example.com', 'https://']) {
      expect(normalizeServerAddress(input)).toBeNull()
    }
  })
})
