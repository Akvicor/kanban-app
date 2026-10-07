import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'
import {ConfigStore, parseConfig} from './store'

describe('parseConfig', () => {
  it('读取合法的服务器来源和窗口状态', () => {
    expect(parseConfig({serverOrigin: 'https://kanban.example.com', window: {x: 10, y: 20, width: 1200, height: 800, maximized: true}})).toEqual({
      serverOrigin: 'https://kanban.example.com',
      window: {x: 10, y: 20, width: 1200, height: 800, maximized: true},
    })
  })

  it('字段格式不对时按没有该项处理', () => {
    expect(parseConfig({serverOrigin: 'https://kanban.example.com/path', window: {width: -1, height: 800}})).toEqual({serverOrigin: null, window: null})
    expect(parseConfig({serverOrigin: 'file:///x'})).toEqual({serverOrigin: null, window: null})
    expect(parseConfig('broken')).toEqual({serverOrigin: null, window: null})
  })
})

describe('ConfigStore', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, {recursive: true, force: true})
  })

  it('写入后重新读取得到相同配置，文件损坏时为空配置', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kanban-app-'))
    dirs.push(dir)
    const file = join(dir, 'sub', 'config.json')
    new ConfigStore(file).update({serverOrigin: 'http://192.168.1.5:3000'})
    expect(new ConfigStore(file).get()).toEqual({serverOrigin: 'http://192.168.1.5:3000', window: null})
    expect(JSON.parse(readFileSync(file, 'utf8')).serverOrigin).toBe('http://192.168.1.5:3000')

    writeFileSync(file, '{broken')
    expect(new ConfigStore(file).get()).toEqual({serverOrigin: null, window: null})
  })
})
