# kanban-app 构建入口：供本地开发和 GitHub Actions 使用。
#
#   make format          ESLint 自动修复（提交前执行）
#   make verify          安装依赖、代码检查、类型检查、单元测试
#   make desktop-build VERSION=<版本> PLATFORM=<linux|windows|darwin> ARCH=<amd64|arm64> OUTPUT_DIR=<目录>
#                        打桌面客户端安装包，文件名为 kanban-app_v<版本>_<PLATFORM>_<ARCH>.<扩展名>

YARN = yarn
DESKTOP_DIR = desktop
DESKTOP_NAME = kanban-app

# 版本号：取自 git describe 并去掉开头的 v；没有 tag 时为 0.0.0-g<提交哈希>，保证符合语义化版本。
# GitHub Actions 和手动打包时由调用方传入 VERSION。
GIT_DESCRIBE := $(shell git describe --tags --always 2>/dev/null)
ifeq ($(origin VERSION),undefined)
  ifneq ($(filter v%,$(GIT_DESCRIBE)),)
    VERSION := $(patsubst v%,%,$(GIT_DESCRIBE))
  else
    VERSION := 0.0.0-g$(or $(GIT_DESCRIBE),unknown)
  endif
endif

# 平台和架构使用与 runner 标签、发布命名一致的写法，这里转换为 electron-builder 的参数和产物扩展名。
EB_PLATFORM_linux = --linux
EB_PLATFORM_windows = --win
EB_PLATFORM_darwin = --mac
EB_ARCH_amd64 = --x64
EB_ARCH_arm64 = --arm64
PACKAGE_EXTS_linux = AppImage deb
PACKAGE_EXTS_windows = exe
PACKAGE_EXTS_darwin = dmg

# macOS 安装包在 macOS 主机上由 electron-builder 直接打 dmg 并签名（electron-builder 只能在 macOS 上签名 macOS 应用、生成 dmg）。
# 没有签名证书（CSC_LINK 为空）时对整个应用做临时签名（ad-hoc）：
# electron-builder 找不到证书时会跳过签名，修改运行时开关后应用包的签名不完整，Apple Silicon 上会提示应用已损坏；
# 临时签名后首次打开按未知开发者处理，可以在系统设置中放行。强化运行时只在公证时需要，临时签名时关闭。
HOST_OS := $(shell uname -s)
ifeq ($(PLATFORM)$(HOST_OS)$(CSC_LINK),darwinDarwin)
  EB_SIGN_ARGS = -c.mac.identity=- -c.mac.hardenedRuntime=false
endif

.PHONY: format verify desktop-install desktop-compile desktop-build

desktop-install:
	@cd $(DESKTOP_DIR) && $(YARN) install --immutable

format: desktop-install
	@cd $(DESKTOP_DIR) && $(YARN) eslint . --fix

verify: desktop-install
	@cd $(DESKTOP_DIR) && $(YARN) lint
	@cd $(DESKTOP_DIR) && $(YARN) typecheck
	@cd $(DESKTOP_DIR) && $(YARN) test

desktop-compile: desktop-install
	@cd $(DESKTOP_DIR) && $(YARN) build

desktop-build: desktop-compile
	@test -n "$(EB_PLATFORM_$(PLATFORM))" || { echo "PLATFORM 必须是 linux、windows 或 darwin：$(PLATFORM)" >&2; exit 1; }
	@test -n "$(EB_ARCH_$(ARCH))" || { echo "ARCH 必须是 amd64 或 arm64：$(ARCH)" >&2; exit 1; }
	@test -n "$(OUTPUT_DIR)" || { echo "需要指定 OUTPUT_DIR" >&2; exit 1; }
	@test "$(PLATFORM)" != darwin || test "$(HOST_OS)" = Darwin || { echo "macOS 安装包需要在 macOS 上打包，当前系统：$(HOST_OS)" >&2; exit 1; }
	@echo "打包 $(DESKTOP_NAME) v$(VERSION) $(PLATFORM)/$(ARCH)"
	@rm -rf $(DESKTOP_DIR)/release
	@mkdir -p "$(OUTPUT_DIR)"
	@cd $(DESKTOP_DIR) && KANBAN_PLATFORM=$(PLATFORM) KANBAN_ARCH=$(ARCH) $(YARN) electron-builder \
		$(EB_PLATFORM_$(PLATFORM)) $(EB_ARCH_$(ARCH)) --publish never -c.extraMetadata.version=$(VERSION) $(EB_SIGN_ARGS)
	@for ext in $(PACKAGE_EXTS_$(PLATFORM)); do \
		file="$(DESKTOP_DIR)/release/$(DESKTOP_NAME)_v$(VERSION)_$(PLATFORM)_$(ARCH).$$ext"; \
		test -f "$$file" || { echo "缺少安装包：$$file" >&2; exit 1; }; \
		cp "$$file" "$(OUTPUT_DIR)/"; \
	done
