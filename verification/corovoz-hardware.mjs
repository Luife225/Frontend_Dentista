// Opt-in acoustic check. The fixture uses the real assistant and detector. Grant audio
// access only on its loopback origin. It never saves or uploads microphone audio.
import assert from 'node:assert/strict'
import { withChromium } from './chromium-session.mjs'

const labels = process.argv.slice(2).filter(arg => !arg.startsWith('--'))
const wavOutput = process.argv.includes('--wav-output')
if (!process.argv.includes('--physical') || labels.length !== 2) {
  throw new Error('Uso: node verification/corovoz-hardware.mjs --physical "nombre del micrófono" "nombre de salida" [--wav-output]')
}
const origin = 'http://127.0.0.1:5187'

function installProbe(inputName, outputName, useWav) {
  const originalGet = MediaDevices.prototype.getUserMedia.bind(navigator.mediaDevices)
  const synth = window.speechSynthesis
  const guard = window.acousticCheck = { started: 0, cancels: 0, captures: 0, uploads: 0, duringPlayback: false, tracks: [], error: '' }
  const devices = () => navigator.mediaDevices.enumerateDevices()
  const match = (list, kind, name) => list.find(d => d.kind === kind && !['default', 'communications'].includes(d.deviceId) && d.label.toLowerCase().includes(name.toLowerCase()))
  const nativeCancel = synth.cancel.bind(synth)
  const nativeSpeak = synth.speak.bind(synth)
  const observe = utterance => {
    if (useWav) {
      player.currentTime = 0
      void player.play().then(() => { guard.started++ }).catch(err => { guard.error = err.name })
    } else {
      utterance.addEventListener('start', () => { guard.started++ }, { once: true })
      nativeSpeak(utterance)
    }
  }
  const player = new Audio('/verification/corovoz-synthetic.wav')
  player.loop = true
  player.volume = 0.35
  const engine = useWav ? {
    get speaking() { return !player.paused }, get pending() { return false },
    getVoices: synth.getVoices.bind(synth), speak: observe,
    cancel() { guard.cancels++; player.pause() },
  } : synth
  if (useWav) Object.defineProperty(window, 'speechSynthesis', { value: engine })
  else { synth.speak = observe; synth.cancel = () => { guard.cancels++; nativeCancel() } }
  guard.prepare = async () => {
    const all = await devices()
    const output = match(all, 'audiooutput', outputName)
    if (!match(all, 'audioinput', inputName) || !output) throw new Error('El equipo no expone el micrófono o la salida solicitados.')
    if (useWav) await player.setSinkId(output.deviceId)
    else if (!all.find(d => d.kind === 'audiooutput' && d.deviceId === 'default')?.label.includes(outputName)) throw new Error('La síntesis nativa usa la salida predeterminada. Usa --wav-output para elegir otra salida sin cambiar Windows.')
  }
  guard.useInput = () => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async constraints => {
      const input = match(await devices(), 'audioinput', inputName)
      if (!input) throw new Error('No se encontró el micrófono solicitado.')
      guard.duringPlayback ||= engine.speaking || engine.pending || !guard.cancels
      const stream = await originalGet({ audio: { ...constraints.audio, deviceId: { exact: input.deviceId } } })
      guard.captures++
      guard.tracks.push(...stream.getAudioTracks())
      return stream
    } })
    const fetchFixture = window.fetch.bind(window)
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      if (url.endsWith('/corovoz/transcribir')) {
        guard.uploads++
        return Promise.resolve(Response.json({ text: '' }))
      }
      return fetchFixture(input, init)
    }
  }
  guard.cleanup = () => {
    guard.tracks.forEach(t => t.stop()); player.pause(); nativeCancel()
  }
}

await withChromium(async browser => {
  const t = await browser.tab()
  await t.send('Browser.grantPermissions', { origin, permissions: ['audioCapture', 'speakerSelection'] })
  await t.send('Page.navigate', { url: `${origin}/verification/corovoz-ui.html?module=pacientes&role=ODONTOLOGO` })
  await t.waitFor("location.pathname === '/app/pacientes' && [...document.querySelectorAll('.corovoz-page button')].some(b => b.textContent.trim() === 'Odontograma')", 30000)
  await t.evaluate(`(${installProbe})(${labels.map(x => JSON.stringify(x)).join(',')},${wavOutput})`)
  try {
    await t.evaluate('acousticCheck.prepare()')
    await t.evaluate('acousticCheck.useInput()')
    await t.evaluate(`[...document.querySelectorAll('.corovoz-page button')].find(b => b.textContent.trim() === 'Odontograma').click()`)
    const tooth = `[...document.querySelectorAll('.corovoz-page span')].find(s => s.textContent === '14' && s.nextElementSibling?.querySelector('svg') && s.getClientRects().length)`
    await t.waitFor(`Boolean(${tooth})`)
    await t.evaluate(`(${tooth}).nextElementSibling.click()`)
    const selected = `document.querySelector('.corovoz-page').innerText.includes('Pieza dental #14')`
    await t.waitFor(selected)
    await t.evaluate(`speechSynthesis.getVoices();document.querySelector('.corovoz-mascot').click()`)
    await t.evaluate(`[...document.querySelectorAll('.corovoz-modes button')].find(e=>e.textContent.includes('General')).click()`)
    await t.waitFor(`!!document.querySelector('#corovoz-text')`)
    await t.evaluate(`document.querySelector('[aria-label="Leer respuestas"]').click(); document.querySelector('#corovoz-text').focus()`)
    await t.send('Input.insertText',{text:'respuesta larga'})
    const clickTrusted = async selector => {
      const pos = await t.evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2} })()`)
      for(const type of ['mousePressed','mouseReleased']) await t.send('Input.dispatchMouseEvent',{ type, button:'left', clickCount:1, ...pos })
    }
    await clickTrusted('button[aria-label=Enviar]')
    await t.waitFor('acousticCheck.started > 0 || !!acousticCheck.error', 12000)
    assert.equal(await t.evaluate('acousticCheck.error'), '')
    await t.evaluate('new Promise(r=>setTimeout(r,650))')
    await clickTrusted('.corovoz-mic')
    await t.waitFor(`document.querySelector('.corovoz-mic')?.getAttribute('aria-pressed') === 'true' || !!document.querySelector('.corovoz-error')`,20000)
    if (await t.evaluate(`document.querySelector('.corovoz-mic').getAttribute('aria-pressed') !== 'true'`)) throw new Error(await t.evaluate(`document.querySelector('.corovoz-error')?.innerText || 'Micrófono sin inicializar'`))
    // Observe a full dictation pause without asking for or retaining a spoken response.
    await t.evaluate('new Promise(r=>setTimeout(r,4200))')
    await t.evaluate(`document.querySelector('.corovoz-mascot').click()`)
    const result = await t.evaluate(`({ started:acousticCheck.started, cancels:acousticCheck.cancels, captures:acousticCheck.captures, duringPlayback:acousticCheck.duringPlayback, uploads:acousticCheck.uploads, released:acousticCheck.tracks.every(t=>t.readyState==='ended') })`)
    assert.equal(await t.evaluate(selected), true)
    console.log(labels.join(' / '), wavOutput ? 'WAV dirigido a la salida física' : 'síntesis nativa', result)
    assert.ok(result.started && result.cancels && result.captures===1 && result.released)
    assert.equal(result.duringPlayback,false)
    assert.equal(result.uploads,0, 'Se detectó voz en la ventana acústica de prueba')
  } finally { await t.evaluate('acousticCheck.cleanup()') }
})
