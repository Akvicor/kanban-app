/**
 * 远程页面的导航去向：
 * - stay：服务器来源内的地址，在客户端窗口中打开；
 * - external：其他 http/https 地址，交给系统浏览器打开；
 * - ignore：其他协议（file:、javascript:、自定义协议等）或无法解析的地址，不做任何事。
 */
export type NavigationTarget = 'stay' | 'external' | 'ignore'

/** 判断地址 target 相对于服务器来源 serverOrigin 的去向。 */
export function navigationTarget(target: string, serverOrigin: string): NavigationTarget {
  let url: URL
  try {
    url = new URL(target)
  } catch {
    return 'ignore'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'ignore'
  return url.origin === serverOrigin ? 'stay' : 'external'
}
