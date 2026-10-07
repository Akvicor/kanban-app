import type {ConnectResult, ServerProblem} from '../../shared/ipc'

/** 看板健康检查接口，相对于服务器来源。 */
export const HEALTH_PATH = '/api/sys/info/health'

/** 健康检查请求的超时时间。 */
const HEALTH_TIMEOUT_MS = 10_000

/** 健康检查的判断结果。 */
export type HealthVerdict = 'ok' | 'not-ready' | 'not-kanban'

/**
 * 判断响应体是不是看板的健康检查结构：
 * `{"status": "healthy" | "unhealthy", "checks": {"<依赖名>": "<状态>"}}`。
 */
export function isHealthBody(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  const {status, checks} = body as {status?: unknown; checks?: unknown}
  if (status !== 'healthy' && status !== 'unhealthy') return false
  if (typeof checks !== 'object' || checks === null || Array.isArray(checks)) return false
  return Object.values(checks).every((value) => typeof value === 'string')
}

/**
 * 按状态码和响应体判断服务器：200 且为健康检查结构时可用；
 * 503 且为健康检查结构时是看板服务但依赖未就绪；其余都不是看板服务。
 */
export function judgeHealth(status: number, body: unknown): HealthVerdict {
  if (!isHealthBody(body)) return 'not-kanban'
  if (status === 200) return 'ok'
  if (status === 503) return 'not-ready'
  return 'not-kanban'
}

/**
 * 把请求失败的错误归类。Chromium 网络栈的错误信息带有 net::ERR_* 代码，
 * 证书相关的错误（ERR_CERT_*、ERR_SSL_*、ERR_BAD_SSL_*）归为证书问题，其余归为无法连接。
 */
export function classifyFetchError(error: unknown): ServerProblem {
  const message = error instanceof Error ? error.message : String(error)
  return /ERR_CERT_|ERR_SSL_|ERR_BAD_SSL_|CERT_/.test(message) ? 'certificate' : 'unreachable'
}

/** 发起请求的函数，与 fetch 签名一致；主进程中传入 Electron 的 net.fetch。 */
export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

/**
 * 请求 `<来源>/api/sys/info/health` 校验服务器。跟随重定向，成功时返回最终响应所在的来源，
 * 例如 http 跳转到 https 后返回 https 来源。
 */
export async function checkServer(origin: string, fetchFn: FetchFn): Promise<ConnectResult> {
  let response: Response
  try {
    response = await fetchFn(origin + HEALTH_PATH, {
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    })
  } catch (error) {
    return {ok: false, problem: classifyFetchError(error)}
  }
  const body: unknown = await response.json().catch(() => null)
  const verdict = judgeHealth(response.status, body)
  if (verdict !== 'ok') return {ok: false, problem: verdict}
  return {ok: true, origin: new URL(response.url || origin).origin}
}
