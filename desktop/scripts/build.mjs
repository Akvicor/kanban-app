// 编译桌面客户端：主进程、preload 和本地页面脚本各打包为单文件，连同页面 HTML、样式和图标写入 dist/。
// dist/ 是 electron-builder 打包的应用内容（package.json 的 main 指向 dist/main.js）。
import {build} from 'esbuild'
import {cpSync, mkdirSync, readdirSync, rmSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const pagesSource = join(root, 'src', 'pages')
const pagesOutput = join(dist, 'pages')

rmSync(dist, {recursive: true, force: true})
mkdirSync(pagesOutput, {recursive: true})

const common = {bundle: true, sourcemap: false, logLevel: 'warning', legalComments: 'none'}

// 主进程和 preload 运行在 Electron 中，electron 模块由运行时提供。
await build({
  ...common,
  entryPoints: {main: join(root, 'src', 'main', 'main.ts'), preload: join(root, 'src', 'preload', 'local.ts')},
  outdir: dist,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  external: ['electron'],
})

// 本地页面脚本运行在沙箱化的渲染进程中。
await build({
  ...common,
  entryPoints: {settings: join(pagesSource, 'settings.ts'), error: join(pagesSource, 'error.ts')},
  outdir: pagesOutput,
  platform: 'browser',
  format: 'iife',
  target: 'chrome140',
})

for (const name of readdirSync(pagesSource)) {
  if (name.endsWith('.html') || name.endsWith('.css')) cpSync(join(pagesSource, name), join(pagesOutput, name))
}
cpSync(join(root, '..', 'assets', 'icon.png'), join(dist, 'icon.png'))
