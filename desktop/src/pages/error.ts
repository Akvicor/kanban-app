import {desktop, element} from './api'
import {applyTexts, problemText, text} from './messages'

/** 错误页：说明服务器打不开的原因，可以重试或更换服务器地址。 */
async function main(): Promise<void> {
  const info = await desktop.pageInfo()
  applyTexts(info.locale)
  element<HTMLParagraphElement>('origin').textContent = info.origin ?? ''
  element<HTMLParagraphElement>('reason').textContent = problemText(info.locale, info.problem ?? 'unreachable')
  element<HTMLParagraphElement>('version').textContent = text(info.locale, 'version', {version: info.version})
  const retry = element<HTMLButtonElement>('retry')
  retry.addEventListener('click', () => desktop.retry())
  element<HTMLButtonElement>('change-server').addEventListener('click', () => desktop.openSettings())
  retry.focus()
}

void main()
