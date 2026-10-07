import {describe, expect, it} from 'vitest'
import {navigationTarget} from './navigation'

const origin = 'https://kanban.example.com'

describe('navigationTarget', () => {
  it('服务器来源内的地址留在客户端窗口', () => {
    expect(navigationTarget('https://kanban.example.com/board/1', origin)).toBe('stay')
    expect(navigationTarget('https://kanban.example.com/api/file/attachment/3', origin)).toBe('stay')
  })

  it('其他 http/https 来源交给系统浏览器', () => {
    expect(navigationTarget('https://github.com/', origin)).toBe('external')
    expect(navigationTarget('http://kanban.example.com/', origin)).toBe('external')
    expect(navigationTarget('https://kanban.example.com:8443/', origin)).toBe('external')
  })

  it('其他协议和无法解析的地址忽略', () => {
    for (const url of ['file:///etc/passwd', 'javascript:alert(1)', 'mailto:a@b.c', 'kanban://x', 'about:blank', 'not a url']) {
      expect(navigationTarget(url, origin)).toBe('ignore')
    }
  })
})
