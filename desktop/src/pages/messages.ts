import type {Locale, ServerProblem} from '../shared/ipc'

/** 本地页面的文案，键名与 HTML 中的 data-i18n 属性对应。 */
const TEXTS = {
  zh: {
    documentTitle: '看板',
    settingsTitle: '连接看板服务器',
    settingsHint: '输入自建看板服务器的地址，例如 https://kanban.example.com。',
    addressLabel: '服务器地址',
    httpWarning: '使用 http 时，登录令牌和看板数据会以明文传输，建议使用 https。',
    connect: '连接',
    connecting: '正在连接…',
    cancel: '取消',
    errorTitle: '无法打开看板',
    retry: '重试',
    changeServer: '更换服务器地址',
    version: '版本 {version}',
  },
  en: {
    documentTitle: 'Kanban',
    settingsTitle: 'Connect to a Kanban server',
    settingsHint: 'Enter the address of your self-hosted Kanban server, for example https://kanban.example.com.',
    addressLabel: 'Server address',
    httpWarning: 'With http, the sign-in token and board data are sent in plain text. https is recommended.',
    connect: 'Connect',
    connecting: 'Connecting…',
    cancel: 'Cancel',
    errorTitle: 'Cannot open Kanban',
    retry: 'Retry',
    changeServer: 'Change server address',
    version: 'Version {version}',
  },
} satisfies Record<Locale, Record<string, string>>

export type TextKey = keyof (typeof TEXTS)['zh']

/** 服务器不可用时的说明。 */
const PROBLEMS: Record<Locale, Record<ServerProblem, string>> = {
  zh: {
    'invalid-address': '地址无效，请输入 http:// 或 https:// 开头的服务器地址。',
    unreachable: '无法连接到服务器，请检查地址、网络，以及服务是否已经启动。',
    certificate: '服务器证书无效。请为服务器配置有效的证书，或更换服务器地址。',
    'not-kanban': '这个地址不是看板服务器。',
    'not-ready': '看板服务器尚未就绪（例如数据库不可用），请稍后再试。',
  },
  en: {
    'invalid-address': 'Invalid address. Enter a server address starting with http:// or https://.',
    unreachable: 'Cannot connect to the server. Check the address, the network, and whether the service is running.',
    certificate: 'The server certificate is invalid. Configure a valid certificate for the server, or change the server address.',
    'not-kanban': 'This address is not a Kanban server.',
    'not-ready': 'The Kanban server is not ready yet (for example, the database is unavailable). Try again later.',
  },
}

/** 取文案并替换 {name} 占位符。 */
export function text(locale: Locale, key: TextKey, values: Record<string, string> = {}): string {
  return TEXTS[locale][key].replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match)
}

export function problemText(locale: Locale, problem: ServerProblem): string {
  return PROBLEMS[locale][problem]
}

/** 按 data-i18n 属性填充页面中的文案，并设置页面语言和标题。 */
export function applyTexts(locale: Locale): void {
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  document.title = text(locale, 'documentTitle')
  for (const element of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    element.textContent = text(locale, element.dataset.i18n as TextKey)
  }
}
