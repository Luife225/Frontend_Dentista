// Start the isolated fixture on 127.0.0.1:5187 before running this file.
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { withChromium } from './chromium-session.mjs'

const origin = 'http://127.0.0.1:5187/verification/corovoz-ui.html'
const button = (name, region = '.corovoz-page') =>
  `[...document.querySelectorAll('${region} button')].find(e => e.getClientRects().length && e.textContent.trim() === ${JSON.stringify(name)})`
const textLeaf = prefix => `[...document.querySelectorAll('.corovoz-page *')].find(e => !e.children.length && e.getClientRects().length && e.textContent.trim().startsWith(${JSON.stringify(prefix)}))`
const query = selector => `document.querySelector(${JSON.stringify(selector)})`
const page = query('.corovoz-page')
const chat = "(getComputedStyle(document.querySelector('.corovoz-bubble')).overflowY === 'auto' ? document.querySelector('.corovoz-bubble') : document.querySelector('.corovoz-scroll'))"
const mascot = query('.corovoz-mascot')

async function openModule(tab, module, role) {
  await tab.send('Page.navigate', { url: `${origin}?module=${module}&role=${role}` })
  await tab.waitFor(`location.pathname === '/app/${module}' && !!${mascot}`, 30000)
}

async function click(tab, element) {
  await tab.waitFor(`Boolean(${element})`)
  await tab.evaluate(`(${element}).click()`)
}

async function sendText(tab, text) {
  await tab.evaluate("document.querySelector('#corovoz-text').focus()")
  await tab.send('Input.insertText', { text })
  await click(tab, query('button[aria-label=Enviar]:enabled'))
}

// A painted point proves that neither a clipped tab nor its sibling covers the target.
function paintedPoint(element) {
  const rect = element.getBoundingClientRect()
  const x = (rect.left + rect.right) / 2
  const y = (rect.top + rect.bottom) / 2
  return element.contains(document.elementFromPoint(x, y))
}

async function wheel(tab, point, deltaY) {
  // Mouse input and getBoundingClientRect use CSS pixels in the main viewport.
  await tab.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: point.x, y: point.y, deltaX: 0, deltaY })
  await delay(110)
}

async function reachWithWheel(tab, expression) {
  await tab.waitFor(`Boolean(${expression})`)
  // Scroll the same region a user would hover. Never move the target via scrollIntoView.
  for (let i = 0; i < 35; i++) {
    if (await tab.evaluate(`(${paintedPoint})(${expression})`)) return i
    const point = await tab.evaluate(`(() => {
      const target = (${expression}).getBoundingClientRect()
      let parent = (${expression}).parentElement
      for (; parent; parent = parent.parentElement) {
        if (!/auto|scroll/.test(getComputedStyle(parent).overflowY) || parent.scrollHeight <= parent.clientHeight + 1) continue
        const rect = parent.getBoundingClientRect()
        const y = Math.max(0, rect.top) + (Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top)) * 0.64
        const x = Math.max(rect.left + 8, Math.min(rect.right - 18, (target.left + target.right) / 2))
        if (!parent.contains(document.elementFromPoint(x, y))) continue
        return { x, y, delta: target.top < y ? -240 : 240 }
      }
      return null
    })()`)
    if (!point) {
      const geometry = await tab.evaluate(`(() => {
        const chain = []
        for (let e = (${expression}); e; e = e.parentElement) {
          const r = e.getBoundingClientRect()
          chain.push([e.className, [r.x,r.y,r.width,r.height].map(Math.round), [e.scrollHeight,e.clientHeight,e.scrollTop],getComputedStyle(e).overflowY])
        }
        return chain
      })()`)
      assert.fail(`Contenido recortado sin región desplazable: ${JSON.stringify(geometry)}`)
    }
    await wheel(tab, point, point.delta)
  }
  assert.fail(`La rueda no alcanzó ${expression}`)
}

async function independentConversation(tab) {
  await click(tab, button('General', '.corovoz-dock'))
  await sendText(tab, 'respuesta larga')
  await tab.waitFor(`${chat}.textContent.includes('10. Esta') && ${chat}.scrollHeight > ${chat}.clientHeight`)
  const before = await tab.evaluate(`[${page}.scrollTop, ${chat}.scrollTop]`)
  const point = await tab.evaluate(`(() => { const r = ${chat}.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await wheel(tab, point, before[1] > 0 ? -240 : 240)
  await tab.waitFor(`${chat}.scrollTop !== ${before[1]}`)
  assert.equal(await tab.evaluate(`${page}.scrollTop`), before[0], 'La rueda del chat movió la ficha')
}

await withChromium(async browser => {
  // Only the throwaway browser profile is affected. This is browser zoom, including reflow.
  const settings = await browser.tab('chrome://settings/appearance')
  await settings.waitFor("typeof chrome.settingsPrivate?.setDefaultZoom === 'function'")
  const tab = await browser.tab()
  const setZoom = async zoom => {
    await settings.evaluate(`new Promise(done => chrome.settingsPrivate.setDefaultZoom(${zoom}, done))`)
    await tab.waitFor(`Math.abs(devicePixelRatio - ${zoom}) < 0.01`)
  }
  await tab.resize(1280, 720)
  await openModule(tab, 'pacientes', 'ODONTOLOGO')
  await click(tab, button('Odontograma'))
  const tooth = `[...document.querySelectorAll('.corovoz-page span')].find(e => e.textContent === '14' && e.nextElementSibling?.querySelector('svg')).nextElementSibling`
  await tab.waitFor(`!!(${textLeaf('Maxilar Superior')})`)
  await click(tab, tooth)
  const clinicalAction = button('Limpiar diente')
  await tab.waitFor(`!!(${clinicalAction})`)
  await click(tab, mascot)
  await click(tab, button('Odontograma', '.corovoz-dock'))
  await sendText(tab, 'caries en pieza 14 cara mesial')
  const proposal = query('.corovoz-proposal')
  await tab.waitFor(`${proposal}?.textContent.includes('14')`)
  const draft = await tab.evaluate(`${proposal}.textContent`)

  for (const [width, height, zoom] of [
    [1280, 720, .8], [1280, 720, 1], [1280, 720, 1.25], [1280, 720, 1.5],
    [1920, 1080, 1], [850, 600, 1], [390, 844, 1],
  ]) {
    await setZoom(1)
    await tab.send('Page.bringToFront')
    if (width < 500) {
      await tab.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true })
    } else await tab.resize(width, height)
    await tab.waitFor(`innerWidth === ${width}`)
    await setZoom(zoom)
    await tab.waitFor(`Math.abs(innerWidth - ${width / zoom}) < 2`)
    await tab.evaluate(`document.querySelectorAll('.corovoz-page, section[aria-label="Ficha del paciente"]').forEach(e => e.scrollTop=0)`)
    const chatPos = await tab.evaluate(`${chat}.scrollTop`)
    const count = await reachWithWheel(tab, clinicalAction)
    assert.equal(await tab.evaluate(`${chat}.scrollTop`), chatPos, 'La rueda de la ficha movió el chat')
    assert.equal(await tab.evaluate(`${proposal}.textContent`), draft)
    assert.equal(await tab.evaluate(`(${paintedPoint})(${query('.corovoz-mic')})`), true, 'Micrófono tapado')
    assert.equal(await tab.evaluate(`${mascot}.getAttribute('aria-expanded')`), 'true')
    console.log(`Odontograma y propuesta: ${width}×${height}, zoom ${zoom * 100}%, ${count} movimientos de rueda`)
  }
  await click(tab, mascot)
  await click(tab, mascot)
  assert.equal(await tab.evaluate(`${proposal}.textContent`), draft)
  await reachWithWheel(tab, clinicalAction)
  await independentConversation(tab)

  await click(tab, button('Historia clínica'))
  await reachWithWheel(tab, button('Registrar Atención Clínica'))
  await click(tab, button('+ Nuevo paciente'))
  await tab.waitFor("!!document.querySelector('.corovoz-page form')")
  const formEnd = `[...document.querySelectorAll('.corovoz-page form input, .corovoz-page form select, .corovoz-page form textarea')].filter(e => e.getClientRects().length).at(-1)`
  await reachWithWheel(tab, formEnd)
  console.log('Historia clínica, formulario de paciente y desplazamiento independiente del chat: OK')

  await tab.send('Emulation.clearDeviceMetricsOverride')
  await tab.resize(900, 600)
  for (const [module, role, last] of [
    ['agenda', 'RECEPCIONISTA', '18:00'], ['inventario', 'RECEPCIONISTA', 'Selecciona un insumo'],
    ['dashboard', 'ODONTOLOGO', 'Canceladas'], ['caja', 'ADMIN_CLINICA', 'Registro interno de cobros'],
    ['consultorio', 'ADMIN_CLINICA', '0 de 0 cuentas'], ['notificaciones', 'RECEPCIONISTA', 'Cuando ocurran eventos'],
    ['teleodontologia', 'ODONTOLOGO', 'No hay teleconsultas'],
  ]) {
    await openModule(tab, module, role)
    await click(tab, mascot)
    await click(tab, button('General', '.corovoz-dock'))
    const anchor = module === 'inventario' ? textLeaf('👈 Selecciona') : textLeaf(last)
    const count = await reachWithWheel(tab, anchor)
    assert.equal(await tab.evaluate(`${mascot}.getAttribute('aria-expanded')`), 'true')
    console.log(`${module} (${role}): extremo accesible, ${count} movimientos de rueda`)
  }
})
