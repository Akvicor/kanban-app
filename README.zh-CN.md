<div align="center">
  <h1>kanban-app</h1>
  <p><em>自建看板服务器的客户端</em></p>
  <p>
    <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-44-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPLv3-blue?style=flat-square" alt="License"></a>
  </p>
  <p>
    <a href="README.md">English</a> | <strong>简体中文</strong>
  </p>
  <p>
    <a href="https://www.ksyaki.com/archives/kanban-zi-tuo-guan-de-ge-ren-ji-hua-yu-dai-ban-kan-ban">博客链接</a>
  </p>
  <p>
    <a href="#工作方式">工作方式</a> · <a href="#安装">安装</a> · <a href="#使用">使用</a> · <a href="#与看板服务器的约定">与看板服务器的约定</a> · <a href="#开发">开发</a> · <a href="#打包与发布">打包与发布</a>
  </p>
</div>

[看板（kanban）](https://github.com/Akvicor/kanban) 的客户端。客户端连接你自建的看板服务器，不用打开浏览器也能使用看板。

- `desktop/`：Linux、Windows、macOS 桌面客户端（Electron）。
- 手机客户端以后放在 `mobile/`。

## 工作方式

桌面客户端是一个外壳：窗口直接加载看板服务器的地址，页面、接口、实时同步和文件都由服务器提供。服务器升级后界面随之更新，客户端只在外壳本身变化（Electron 安全更新、外壳功能）时才需要更新。

## 安装

在 [Releases](https://github.com/Akvicor/kanban-app/releases) 下载对应系统的安装包（`checksums.txt` 为 SHA-256 校验值）：

| 系统 | 安装包 |
|------|--------|
| Linux | `kanban-app_<版本>_linux_<架构>.AppImage`（加执行权限后直接运行）或 `.deb` |
| Windows | `kanban-app_<版本>_windows_amd64.exe` |
| macOS | `kanban-app_<版本>_darwin_<架构>.dmg`（Apple 芯片选 `arm64`，Intel 芯片选 `amd64`） |

安装包没有使用开发者证书签名，首次打开时系统会提示：

- **macOS**：在「系统设置 → 隐私与安全性」中点「仍要打开」，或执行 `xattr -dr com.apple.quarantine /Applications/Kanban.app`。
- **Windows**：在「Windows 已保护你的电脑」提示中点「更多信息 → 仍要运行」。

升级时下载新版本安装包覆盖安装。

## 使用

- 首次启动输入服务器地址，例如 `https://kanban.example.com`。
  - 只需要协议、主机和端口，路径会被去掉；不写协议时按 https 处理。
  - 客户端通过健康检查接口确认这是看板服务器，然后打开它。
- 菜单「更换服务器地址」可以随时换到其他服务器，各服务器的登录状态分别保存。Windows、Linux 上菜单栏默认隐藏，按 `Ctrl+Shift+M` 显示或隐藏；这是客户端唯一自带的快捷键，其余按键都交给看板网页，刷新、缩放、全屏在「视图」菜单中点击使用。
- 推荐使用 https；使用 http 时，登录令牌和看板数据会以明文传输。
- 站外链接在系统浏览器中打开；下载附件时弹出系统的「另存为」对话框。

## 与看板服务器的约定

客户端依赖看板服务器的以下行为，任何一方修改时都要同步另一方：

- 健康检查 `GET /api/sys/info/health`：返回 200 和 `{"status": "...", "checks": {...}}`，客户端据此确认地址是看板服务。依赖未就绪时返回 503。
- User-Agent 标记 `KanbanApp/<版本>`：看板前端据此把设备列表中的设备名显示为「桌面客户端 · 系统」。
- 客户端只放行剪贴板写入和全屏两项网页权限（`desktop/src/main/security/permissions.ts`）。看板前端需要新的浏览器权限时，客户端要同步放行。

## 开发

需要 Node.js `>=24.15.0 <25`。Yarn 使用仓库自带的版本（`desktop/.yarn/releases`）。

```bash
make verify          # 安装依赖、ESLint、类型检查、单元测试
make format          # ESLint 自动修复
cd desktop && yarn start   # 编译并启动客户端
```

目录结构：

```
assets/              各客户端共用的图标
desktop/
├── src/main/        主进程：启动、窗口、菜单、服务器地址、导航与权限策略、配置存储
├── src/preload/     本地页面（设置页、错误页）的 preload
├── src/pages/       本地设置页、错误页
├── src/shared/      主进程与本地页面之间的 IPC 约定
└── scripts/         编译脚本（esbuild）
```

当前使用 Electron 44.5.1、electron-builder 26.15.3，版本固定在 `desktop/package.json` 中。

## 打包与发布

```bash
make desktop-build VERSION=1.2.0 PLATFORM=linux ARCH=amd64 OUTPUT_DIR=dist
```

- `PLATFORM`：`linux`、`windows`、`darwin`；`ARCH`：`amd64`、`arm64`（Windows 只支持 `amd64`）。
- 安装包文件名为 `kanban-app_v<版本>_<PLATFORM>_<ARCH>.<扩展名>`。
- 没传 `VERSION` 时取自 `git describe`（去掉开头的 `v`），没有 tag 时为 `0.0.0-g<提交哈希>`。
- macOS 安装包（dmg）需要在 macOS 上打包，由 electron-builder 直接生成；其他系统上指定 `PLATFORM=darwin` 会报错。

发布：推送 `v1.2.0` 这样的 tag 后，GitHub Actions 先运行 `make verify`，再在各系统的 runner 上构建 Linux amd64/arm64、Windows amd64、macOS arm64/amd64 安装包，连同 `checksums.txt` 上传到 GitHub Release。

签名：发布的安装包不使用证书，macOS 包为临时签名，Windows 包不签名。本地打包时可以通过标准环境变量使用证书：Windows 为 `WIN_CSC_LINK`、`WIN_CSC_KEY_PASSWORD`；macOS 为 `CSC_LINK`、`CSC_KEY_PASSWORD`，公证另需 `APPLE_API_KEY`、`APPLE_API_KEY_ID`、`APPLE_API_ISSUER`。

## 许可

本项目采用 [GNU General Public License v3.0](LICENSE) 开源协议发布。

- 修改和分发时必须同样以 GPLv3 开源
- 分发二进制时必须提供对应的完整源代码
- 不提供任何担保

协议全文见 [LICENSE](LICENSE)。
