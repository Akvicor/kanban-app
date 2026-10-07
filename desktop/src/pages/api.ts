import type {DesktopApi} from '../shared/ipc'

/** preload 暴露的客户端接口，只在本地窗口中存在。 */
export const desktop = (window as unknown as {kanbanApp: DesktopApi}).kanbanApp

/** 按 id 取页面元素；元素缺失说明页面与脚本不一致，直接报错。 */
export function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id)
  if (found === null) throw new Error(`页面缺少元素 #${id}`)
  return found as T
}
