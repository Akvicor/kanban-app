import {describe, expect, it} from 'vitest'
import {DEFAULT_WINDOW_SIZE, MIN_WINDOW_SIZE, restoreBounds} from './bounds'

const primary = {x: 0, y: 0, width: 1920, height: 1040}
const external = {x: 1920, y: 0, width: 2560, height: 1400}

describe('restoreBounds', () => {
  it('没有保存过时使用默认大小，位置交给系统', () => {
    expect(restoreBounds(null, [primary])).toEqual(DEFAULT_WINDOW_SIZE)
  })

  it('保存的位置仍在显示器内时沿用', () => {
    const saved = {x: 2000, y: 100, width: 1400, height: 900, maximized: false}
    expect(restoreBounds(saved, [primary, external])).toEqual({x: 2000, y: 100, width: 1400, height: 900})
  })

  it('保存的位置所在的显示器已不存在时只沿用大小', () => {
    const saved = {x: 2000, y: 100, width: 1400, height: 900, maximized: false}
    expect(restoreBounds(saved, [primary])).toEqual({width: 1400, height: 900})
  })

  it('标题栏只露出一小条时回到系统位置', () => {
    const saved = {x: 1880, y: 100, width: 1200, height: 800, maximized: false}
    expect(restoreBounds(saved, [primary])).toEqual({width: 1200, height: 800})
  })

  it('大小不小于最小值', () => {
    expect(restoreBounds({width: 100, height: 100, maximized: false}, [primary])).toEqual(MIN_WINDOW_SIZE)
  })
})
