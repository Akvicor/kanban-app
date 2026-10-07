import type {WindowState} from '../config/store'

/** 屏幕上的矩形区域。 */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** 主窗口的默认大小和最小大小。 */
export const DEFAULT_WINDOW_SIZE = {width: 1280, height: 800}
export const MIN_WINDOW_SIZE = {width: 640, height: 480}

/** 窗口顶部标题栏区域的高度，以及其中至少要落在显示器内的宽度，满足时用户才能拖动窗口。 */
const TITLE_HEIGHT = 40
const MIN_VISIBLE_TITLE_WIDTH = 100

/** 两个矩形重叠部分的宽和高；不重叠时为 0。 */
function overlap(a: Rect, b: Rect): {width: number; height: number} {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return {width: Math.max(width, 0), height: Math.max(height, 0)}
}

/**
 * 计算恢复窗口时使用的位置和大小。
 * 保存的位置能让窗口标题栏有足够的部分落在某个显示器的工作区内时沿用；
 * 否则（例如外接显示器已拔掉）只沿用大小，位置交给系统居中。
 */
export function restoreBounds(saved: WindowState | null, workAreas: Rect[]): Partial<Rect> & {width: number; height: number} {
  const width = Math.max(saved?.width ?? DEFAULT_WINDOW_SIZE.width, MIN_WINDOW_SIZE.width)
  const height = Math.max(saved?.height ?? DEFAULT_WINDOW_SIZE.height, MIN_WINDOW_SIZE.height)
  if (saved?.x === undefined || saved.y === undefined) return {width, height}
  const title: Rect = {x: saved.x, y: saved.y, width, height: TITLE_HEIGHT}
  const visible = workAreas.some((area) => {
    const part = overlap(title, area)
    return part.width >= Math.min(MIN_VISIBLE_TITLE_WIDTH, width) && part.height >= TITLE_HEIGHT
  })
  return visible ? {x: saved.x, y: saved.y, width, height} : {width, height}
}
