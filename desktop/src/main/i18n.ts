import type {Locale} from '../shared/ipc'

/** 按系统语言选择界面语言：中文系统用中文，其余用英文。 */
export function resolveLocale(systemLocale: string): Locale {
  return systemLocale.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

/** 主进程中菜单和对话框的文案。 */
const MESSAGES = {
  zh: {
    appName: '看板',
    menuFile: '文件',
    menuEdit: '编辑',
    menuView: '视图',
    menuWindow: '窗口',
    menuHelp: '帮助',
    changeServer: '更换服务器地址…',
    quit: '退出',
    reload: '刷新',
    forceReload: '强制刷新',
    resetZoom: '实际大小',
    zoomIn: '放大',
    zoomOut: '缩小',
    toggleFullScreen: '切换全屏',
    toggleMenuBar: '显示/隐藏菜单栏',
    about: '关于看板',
    aboutDetail: '版本 {version}\nElectron {electron}\nChromium {chrome}',
  },
  en: {
    appName: 'Kanban',
    menuFile: 'File',
    menuEdit: 'Edit',
    menuView: 'View',
    menuWindow: 'Window',
    menuHelp: 'Help',
    changeServer: 'Change Server Address…',
    quit: 'Quit',
    reload: 'Reload',
    forceReload: 'Force Reload',
    resetZoom: 'Actual Size',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    toggleFullScreen: 'Toggle Full Screen',
    toggleMenuBar: 'Show/Hide Menu Bar',
    about: 'About Kanban',
    aboutDetail: 'Version {version}\nElectron {electron}\nChromium {chrome}',
  },
} satisfies Record<Locale, Record<string, string>>

export type MessageKey = keyof (typeof MESSAGES)['zh']

/** 取文案并替换 {name} 占位符。 */
export function message(locale: Locale, key: MessageKey, values: Record<string, string> = {}): string {
  return MESSAGES[locale][key].replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match)
}
