/** 输入中带有协议的判断，例如 https://、http://。 */
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i

/**
 * 把用户输入的服务器地址规范化为来源（协议 + 主机 + 端口）。
 *
 * - 没写协议时按 https 补全；
 * - 只接受 http、https，且必须有主机名，不允许在地址中携带账号密码；
 * - 路径、查询参数和片段都去掉：看板前端部署在站点根路径，接口使用绝对路径 /api。
 *
 * 地址无效时返回 null。
 */
export function normalizeServerAddress(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '') return null
  const candidate = SCHEME_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.hostname === '' || url.username !== '' || url.password !== '') return null
  return url.origin
}
