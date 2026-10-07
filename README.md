<div align="center">
  <h1>kanban-app</h1>
  <p><em>Clients for your self-hosted Kanban server</em></p>
  <p>
    <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-44-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPLv3-blue?style=flat-square" alt="License"></a>
  </p>
  <p>
    <strong>English</strong> | <a href="README.zh-CN.md">简体中文</a>
  </p>
  <p>
    <a href="#how-it-works">How it works</a> · <a href="#install">Install</a> · <a href="#usage">Usage</a> · <a href="#contract-with-the-kanban-server">Server contract</a> · <a href="#development">Development</a> · <a href="#packaging-and-release">Packaging and release</a>
  </p>
</div>

Clients for [Kanban](https://github.com/Akvicor/kanban). A client connects to your self-hosted Kanban server, so you can use Kanban without opening a browser.

- `desktop/`: desktop client for Linux, Windows and macOS (Electron).
- Mobile clients will live in `mobile/` later.

## How it works

The desktop client is a shell: its window loads the address of your Kanban server, and the pages, API, real-time sync and files all come from the server. The interface updates together with the server; the client itself only needs updating when the shell changes (Electron security updates, shell features).

## Install

Download the package for your system from [Releases](https://github.com/Akvicor/kanban-app/releases) (`checksums.txt` lists SHA-256 checksums):

| System | Package |
|--------|---------|
| Linux | `kanban-app_<version>_linux_<arch>.AppImage` (make it executable and run it) or `.deb` |
| Windows | `kanban-app_<version>_windows_amd64.exe` |
| macOS | `kanban-app_<version>_darwin_<arch>.dmg` (`arm64` for Apple silicon, `amd64` for Intel) |

The packages are not signed with a developer certificate, so the system warns on first launch:

- **macOS**: click "Open Anyway" in System Settings → Privacy & Security, or run `xattr -dr com.apple.quarantine /Applications/Kanban.app`.
- **Windows**: in the "Windows protected your PC" dialog, click "More info → Run anyway".

To upgrade, download the new package and install it over the old one.

## Usage

- On first launch, enter the server address, for example `https://kanban.example.com`.
  - Only the scheme, host and port are kept; https is assumed when no scheme is given.
  - The client checks the health endpoint to make sure it is a Kanban server, then opens it.
- Use "Change Server Address" in the menu to switch servers at any time; each server keeps its own sign-in state. On Windows and Linux the menu bar is hidden by default; press `Ctrl+Shift+M` to show or hide it. This is the only shortcut the client adds; all other keys go to the Kanban page, and reload, zoom and full screen are available from the View menu.
- https is recommended; with http the sign-in token and board data are sent in plain text.
- External links open in the system browser; downloading an attachment shows the system "Save As" dialog.

## Contract with the Kanban server

The client relies on these server behaviors; when either side changes them, update the other side too:

- Health check `GET /api/sys/info/health`: returns 200 with `{"status": "...", "checks": {...}}`, which tells the client the address is a Kanban server. It returns 503 when a dependency is not ready.
- User-Agent marker `KanbanApp/<version>`: the Kanban frontend uses it to show the device as "Desktop app · <system>" in the device list.
- The client only grants two web permissions: clipboard write and fullscreen (`desktop/src/main/security/permissions.ts`). When the Kanban frontend needs a new browser permission, the client must allow it as well.

## Development

Requires Node.js `>=24.15.0 <25`. Yarn is the version bundled in the repository (`desktop/.yarn/releases`).

```bash
make verify          # install dependencies, ESLint, type check, unit tests
make format          # ESLint auto-fix
cd desktop && yarn start   # compile and start the client
```

Layout:

```
assets/              icons shared by all clients
desktop/
├── src/main/        main process: startup, windows, menu, server address, navigation and permission policy, config storage
├── src/preload/     preload for the local pages (settings, error)
├── src/pages/       local settings page and error page
├── src/shared/      IPC contract between the main process and the local pages
└── scripts/         build script (esbuild)
```

The project uses Electron 44.5.1 and electron-builder 26.15.3, pinned in `desktop/package.json`.

## Packaging and release

```bash
make desktop-build VERSION=1.2.0 PLATFORM=linux ARCH=amd64 OUTPUT_DIR=dist
```

- `PLATFORM`: `linux`, `windows`, `darwin`; `ARCH`: `amd64`, `arm64` (Windows supports `amd64` only).
- Package file names are `kanban-app_v<version>_<PLATFORM>_<ARCH>.<ext>`.
- Without `VERSION`, it comes from `git describe` (leading `v` removed), or `0.0.0-g<commit>` when there is no tag.
- macOS packages (dmg) must be built on macOS, where electron-builder produces the dmg directly; `PLATFORM=darwin` fails on other systems.

Release: after pushing a tag such as `v1.2.0`, GitHub Actions runs `make verify`, then builds the Linux amd64/arm64, Windows amd64 and macOS arm64/amd64 packages on runners of each system and uploads them with `checksums.txt` to the GitHub Release.

Signing: released packages use no certificates; macOS packages are ad-hoc signed and Windows packages are unsigned. For local builds, certificates are read from the standard environment variables: `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` for Windows; `CSC_LINK`, `CSC_KEY_PASSWORD` for macOS, plus `APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER` for notarization.

## License

This project is released under the [GNU General Public License v3.0](LICENSE).

- Derivative works must be distributed under GPLv3 as well
- Distributing binaries requires providing the complete corresponding source code
- No warranty is provided

See [LICENSE](LICENSE) for the full text.
