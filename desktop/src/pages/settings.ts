import {desktop, element} from './api'
import {applyTexts, problemText, text} from './messages'

/** 输入以 http:// 开头时提示明文传输。 */
const HTTP_PATTERN = /^\s*http:\/\//i

/** 服务器设置页：输入地址并连接；已有保存的地址时可以取消，回到看板。 */
async function main(): Promise<void> {
  const info = await desktop.pageInfo()
  applyTexts(info.locale)

  const form = element<HTMLFormElement>('form')
  const address = element<HTMLInputElement>('address')
  const warning = element<HTMLParagraphElement>('http-warning')
  const error = element<HTMLParagraphElement>('error')
  const connect = element<HTMLButtonElement>('connect')
  const cancel = element<HTMLButtonElement>('cancel')
  element<HTMLParagraphElement>('version').textContent = text(info.locale, 'version', {version: info.version})

  const updateWarning = () => {
    warning.hidden = !HTTP_PATTERN.test(address.value)
  }
  address.value = info.origin ?? ''
  address.addEventListener('input', () => {
    updateWarning()
    error.hidden = true
  })
  updateWarning()
  address.focus()
  address.select()

  cancel.hidden = !info.cancellable
  cancel.addEventListener('click', () => desktop.cancel())
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && info.cancellable) desktop.cancel()
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    connect.disabled = true
    address.disabled = true
    connect.textContent = text(info.locale, 'connecting')
    error.hidden = true
    void desktop.connect(address.value).then((result) => {
      if (result.ok) return
      error.textContent = problemText(info.locale, result.problem)
      error.hidden = false
      connect.disabled = false
      address.disabled = false
      connect.textContent = text(info.locale, 'connect')
      address.focus()
    })
  })
}

void main()
