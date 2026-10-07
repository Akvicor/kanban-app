import {mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'

/** 主窗口的位置、大小和最大化状态。位置在首次保存前没有值。 */
export interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  maximized: boolean
}

/** 客户端配置，保存在 userData 目录下的 config.json。 */
export interface DesktopConfig {
  /** 已校验的服务器来源，例如 https://kanban.example.com。 */
  serverOrigin: string | null
  /** 上次关闭时的主窗口状态。 */
  window: WindowState | null
}

const EMPTY_CONFIG: DesktopConfig = {serverOrigin: null, window: null}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** 读取窗口状态；宽高缺失或不是正数时视为没有保存过。 */
function parseWindowState(value: unknown): WindowState | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  if (!isFiniteNumber(raw.width) || !isFiniteNumber(raw.height) || raw.width <= 0 || raw.height <= 0) return null
  const state: WindowState = {width: Math.round(raw.width), height: Math.round(raw.height), maximized: raw.maximized === true}
  if (isFiniteNumber(raw.x) && isFiniteNumber(raw.y)) {
    state.x = Math.round(raw.x)
    state.y = Math.round(raw.y)
  }
  return state
}

/** 读取服务器来源；只接受 http、https 的来源形式（不带路径）。 */
function parseServerOrigin(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin === value) return value
  } catch {
    return null
  }
  return null
}

/** 把配置文件内容解析为配置；字段缺失或格式不对时按没有该项处理。 */
export function parseConfig(raw: unknown): DesktopConfig {
  if (typeof raw !== 'object' || raw === null) return {...EMPTY_CONFIG}
  const value = raw as Record<string, unknown>
  return {serverOrigin: parseServerOrigin(value.serverOrigin), window: parseWindowState(value.window)}
}

/** 配置文件的读写。写入先写临时文件再重命名，避免写到一半时退出留下损坏的文件。 */
export class ConfigStore {
  private config: DesktopConfig

  constructor(private readonly filePath: string) {
    this.config = ConfigStore.load(filePath)
  }

  private static load(filePath: string): DesktopConfig {
    try {
      return parseConfig(JSON.parse(readFileSync(filePath, 'utf8')))
    } catch {
      return {...EMPTY_CONFIG}
    }
  }

  get(): DesktopConfig {
    return this.config
  }

  update(patch: Partial<DesktopConfig>): void {
    this.config = {...this.config, ...patch}
    mkdirSync(dirname(this.filePath), {recursive: true})
    const temp = `${this.filePath}.tmp`
    writeFileSync(temp, JSON.stringify(this.config, null, 2), 'utf8')
    renameSync(temp, this.filePath)
  }
}
