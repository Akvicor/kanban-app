import {describe, expect, it} from 'vitest'
import {message, resolveLocale} from './i18n'

describe('resolveLocale', () => {
  it('中文系统使用中文，其余使用英文', () => {
    expect(resolveLocale('zh-CN')).toBe('zh')
    expect(resolveLocale('zh-TW')).toBe('zh')
    expect(resolveLocale('en-US')).toBe('en')
    expect(resolveLocale('ja')).toBe('en')
  })
})

describe('message', () => {
  it('替换占位符', () => {
    expect(message('en', 'aboutDetail', {version: '1.2.0', electron: '44.5.1', chrome: '150'})).toBe('Version 1.2.0\nElectron 44.5.1\nChromium 150')
  })
})
