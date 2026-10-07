import {describe, expect, it} from 'vitest'
import {checkServer, classifyFetchError, HEALTH_PATH, judgeHealth, type FetchFn} from './health'

const healthy = {status: 'healthy', checks: {database: 'healthy'}}
const unhealthy = {status: 'unhealthy', checks: {database: 'unhealthy'}}

/** 构造返回固定响应的 fetch，并记录请求地址。 */
function fakeFetch(status: number, body: string, finalUrl?: string) {
  const requests: string[] = []
  const fn: FetchFn = async (input) => {
    requests.push(input)
    const response = new Response(body, {status, headers: {'Content-Type': 'application/json'}})
    Object.defineProperty(response, 'url', {value: finalUrl ?? input})
    return response
  }
  return {fn, requests}
}

describe('judgeHealth', () => {
  it('200 且为健康检查结构时可用，503 时未就绪', () => {
    expect(judgeHealth(200, healthy)).toBe('ok')
    expect(judgeHealth(503, unhealthy)).toBe('not-ready')
  })

  it('结构不符或状态码不符时不是看板服务', () => {
    expect(judgeHealth(200, {code: 0, data: null})).toBe('not-kanban')
    expect(judgeHealth(200, null)).toBe('not-kanban')
    expect(judgeHealth(200, {status: 'healthy', checks: []})).toBe('not-kanban')
    expect(judgeHealth(200, {status: 'healthy', checks: {database: 1}})).toBe('not-kanban')
    expect(judgeHealth(404, healthy)).toBe('not-kanban')
  })
})

describe('classifyFetchError', () => {
  it('证书和 SSL 错误归为证书问题，其余归为无法连接', () => {
    expect(classifyFetchError(new Error('net::ERR_CERT_AUTHORITY_INVALID'))).toBe('certificate')
    expect(classifyFetchError(new Error('net::ERR_SSL_PROTOCOL_ERROR'))).toBe('certificate')
    expect(classifyFetchError(new Error('net::ERR_CONNECTION_REFUSED'))).toBe('unreachable')
    expect(classifyFetchError('timeout')).toBe('unreachable')
  })
})

describe('checkServer', () => {
  it('请求健康检查接口，成功时返回跟随重定向后的来源', async () => {
    const {fn, requests} = fakeFetch(200, JSON.stringify(healthy), 'https://kanban.example.com/api/sys/info/health')
    await expect(checkServer('http://kanban.example.com', fn)).resolves.toEqual({ok: true, origin: 'https://kanban.example.com'})
    expect(requests).toEqual(['http://kanban.example.com' + HEALTH_PATH])
  })

  it('响应不是 JSON 时不是看板服务', async () => {
    const {fn} = fakeFetch(200, '<html></html>')
    await expect(checkServer('https://example.com', fn)).resolves.toEqual({ok: false, problem: 'not-kanban'})
  })

  it('依赖未就绪和请求失败时返回对应原因', async () => {
    await expect(checkServer('https://kanban.example.com', fakeFetch(503, JSON.stringify(unhealthy)).fn)).resolves.toEqual({ok: false, problem: 'not-ready'})
    const failing: FetchFn = async () => {
      throw new Error('net::ERR_CERT_DATE_INVALID')
    }
    await expect(checkServer('https://kanban.example.com', failing)).resolves.toEqual({ok: false, problem: 'certificate'})
  })
})
