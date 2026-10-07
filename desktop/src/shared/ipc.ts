/**
 * 主进程与本地页面（服务器设置页、错误页）之间的约定：IPC 通道名和传递的数据结构。
 * 本地页面经 preload 的 contextBridge 调用这些通道；远程的看板页面不加载 preload，无法访问。
 */

/** IPC 通道名。 */
export const IpcChannel = {
  PageInfo: 'local:page-info',
  Connect: 'local:connect',
  Cancel: 'local:cancel',
  Retry: 'local:retry',
  OpenSettings: 'local:open-settings',
} as const

/** 界面语言：系统语言为中文时用 zh，其余用 en。 */
export type Locale = 'zh' | 'en'

/**
 * 服务器不可用的原因：
 * - invalid-address：输入的不是 http/https 地址；
 * - unreachable：无法连接（网络、DNS、端口、超时等）；
 * - certificate：证书无效；
 * - not-kanban：服务器有响应，但不是看板的健康检查结构；
 * - not-ready：是看板服务，但健康检查报告依赖未就绪。
 */
export type ServerProblem = 'invalid-address' | 'unreachable' | 'certificate' | 'not-kanban' | 'not-ready'

/** 本地页面打开时向主进程获取的信息。 */
export interface PageInfo {
  locale: Locale
  /** 客户端版本号。 */
  version: string
  /** 设置页：当前保存的服务器来源；错误页：加载失败的服务器来源。没有时为 null。 */
  origin: string | null
  /** 错误页显示的失败原因；设置页为 null。 */
  problem: ServerProblem | null
  /** 设置页是否可以取消：已有保存的服务器地址时可以回到看板。 */
  cancellable: boolean
}

/** 连接服务器的结果：成功时为规范化并跟随重定向后的服务器来源。 */
export type ConnectResult = {ok: true; origin: string} | {ok: false; problem: ServerProblem}

/** preload 以 window.kanbanApp 暴露给本地页面的接口。 */
export interface DesktopApi {
  pageInfo(): Promise<PageInfo>
  /** 规范化并校验地址，成功后保存并打开看板。 */
  connect(address: string): Promise<ConnectResult>
  /** 关闭设置页，回到已保存的服务器。 */
  cancel(): void
  /** 错误页：重新加载已保存的服务器。 */
  retry(): void
  /** 错误页：打开设置页更换服务器地址。 */
  openSettings(): void
}
