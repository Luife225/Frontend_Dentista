// Isolated headless browser for the local UI fixtures. Requires Node 22+.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

export async function eventually(check, description, timeout = 10000) {
  const deadline = Date.now() + timeout
  do {
    const value = await check()
    if (value) return value
    await delay(40)
  } while (Date.now() < deadline)
  throw new Error(`Tiempo agotado: ${description}`)
}

async function connect(url) {
  const socket = new WebSocket(url)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })
  let id = 0
  const requests = new Map()
  socket.onmessage = event => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') {
      const error = message.params.exceptionDetails
      console.error(error.exception?.description || error.text)
    }
    const request = requests.get(message.id)
    if (!request) return
    requests.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
  }
  socket.onclose = () => {
    for (const request of requests.values()) request.reject(new Error('Navegador cerrado'))
    requests.clear()
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    requests.set(++id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async expression => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text)
    return result.value
  }
  return {
    send, evaluate,
    waitFor: (condition, timeout) => eventually(() => evaluate(condition), condition, timeout),
    resize: async (width, height) => {
      const { windowId } = await send('Browser.getWindowForTarget')
      await send('Browser.setContentsSize', { windowId, width, height })
    },
    close: () => socket.close(),
  }
}

export async function withChromium(run) {
  const executable = [
    process.env.COROVOZ_CHROMIUM,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium',
  ].find(path => path && existsSync(path))
  if (!executable) throw new Error('Indica la ruta de Chromium con COROVOZ_CHROMIUM.')
  const directory = await mkdtemp(join(resolve(tmpdir()), 'corovoz-browser-'))
  const child = spawn(executable, [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--force-device-scale-factor=1',
    `--user-data-dir=${directory}`, 'about:blank',
  ], { stdio: 'ignore', windowsHide: true })
  const exited = new Promise(resolve => child.once('exit', resolve))
  let control
  const tabs = []
  try {
    const [port, path] = await eventually(async () => {
      if (child.exitCode !== null) throw new Error(`Chromium terminó con código ${child.exitCode}`)
      const data = await readFile(join(directory, 'DevToolsActivePort'), 'utf8').catch(() => '')
      return data.includes('/devtools/browser/') && data.trim().split(/\r?\n/)
    }, 'inicio de Chromium', 20000)
    const origin = `http://127.0.0.1:${port}`
    control = await connect(`ws://127.0.0.1:${port}${path}`)
    const tab = async (url = 'about:blank') => {
      const response = await fetch(`${origin}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
      if (!response.ok) throw new Error(`Abrir pestaña: ${response.status}`)
      const session = await connect((await response.json()).webSocketDebuggerUrl)
      tabs.push(session)
      await session.send('Runtime.enable')
      return session
    }
    await run({ tab })
  } finally {
    for (const tab of tabs) tab.close()
    if (control) await control.send('Browser.close').catch(() => {})
    else child.kill()
    await Promise.race([exited, delay(2500, undefined, { ref: false })])
    if (child.exitCode === null) child.kill()
    if (dirname(directory) === resolve(tmpdir())) await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 })
  }
}
