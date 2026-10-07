/**
 * 远程页面可以获得的网页权限：剪贴板写入（代码块复制按钮）和全屏（视频预览）。
 * 看板前端需要新的浏览器权限时，在这里同步放行，并在 README 的约定中说明。
 */
export const ALLOWED_PERMISSIONS: ReadonlySet<string> = new Set(['clipboard-sanitized-write', 'fullscreen'])

/** 来自服务器来源的页面请求白名单中的权限时允许，其余一律拒绝。 */
export function isPermissionAllowed(permission: string, requestingUrl: string, serverOrigin: string | null): boolean {
  if (serverOrigin === null || !ALLOWED_PERMISSIONS.has(permission)) return false
  try {
    return new URL(requestingUrl).origin === serverOrigin
  } catch {
    return false
  }
}
