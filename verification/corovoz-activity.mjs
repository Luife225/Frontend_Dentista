import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/coroVozActivity.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { emptySpeechActivity, updateSpeechActivity, pauseReached, shouldAutoSend, shouldStopIdle, speechDetectionMode, shouldStopConversationIdle } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const rate = 16000
const chunk = 1600
let activity = emptySpeechActivity()
for (let i = 0; i < 10; i++) activity = updateSpeechActivity(activity, 0.002, chunk)
assert.equal(activity.voiced, false)
assert.equal(pauseReached(activity, rate), false)
for (let i = 0; i < 10; i++) activity = updateSpeechActivity(activity, 0.95, chunk)
assert.equal(activity.voiced, true)
for (let i = 0; i < 34; i++) activity = updateSpeechActivity(activity, 0.003, chunk)
assert.equal(pauseReached(activity, rate), false)
activity = updateSpeechActivity(activity, 0.003, chunk)
assert.equal(pauseReached(activity, rate), true)
assert.equal(shouldAutoSend(activity, rate, 'pause'), true)
assert.equal(shouldAutoSend(activity, rate, 'manual'), false)

activity = emptySpeechActivity()
for (let i = 0; i < 10; i++) activity = updateSpeechActivity(activity, 0.009, chunk)
for (let i = 0; i < 10; i++) activity = updateSpeechActivity(activity, 0.85, chunk)
for (let i = 0; i < 35; i++) activity = updateSpeechActivity(activity, 0.009, chunk)
assert.equal(pauseReached(activity, rate), true)

// High room volume is irrelevant: only probabilities from the local VAD enter the timer.
activity = emptySpeechActivity()
for (let i = 0; i < 150; i++) activity = updateSpeechActivity(activity, 0.15, chunk)
assert.equal(activity.voiced, false)
assert.equal(shouldStopIdle(activity, rate), true)
assert.equal(pauseReached(activity, rate), false)
// A brief click cannot create a speech segment.
activity = updateSpeechActivity(emptySpeechActivity(), 0.9, 512)
activity = updateSpeechActivity(activity, 0.1, 512)
assert.equal(activity.voiced, false)
// A resumed phrase resets the silence counter before the 3.5-second deadline.
for (let i = 0; i < 10; i++) activity = updateSpeechActivity(activity, 0.9, chunk)
for (let i = 0; i < 34; i++) activity = updateSpeechActivity(activity, 0.1, chunk)
activity = updateSpeechActivity(activity, 0.7, chunk)
assert.equal(activity.silenceSamples, 0)
console.log('Actividad: voz local, ruido, pausa manual/automática e inactividad verificados.')
// A short, softer word is useful in manual mode; a single click still is not.
let manual = emptySpeechActivity(), auto = emptySpeechActivity()
for (let i = 0; i < 3; i++) {
  manual = updateSpeechActivity(manual, 0.48, 512, 'manual')
  auto = updateSpeechActivity(auto, 0.48, 512, 'pause')
}
assert.equal(manual.voiced, true)
assert.equal(auto.voiced, false)
assert.equal(updateSpeechActivity(emptySpeechActivity(), 0.9, 512, 'manual').voiced, false)
for (let i = 0; i < 110; i++) manual = updateSpeechActivity(manual, 0.15, 512, 'manual')
assert.equal(pauseReached(manual, rate), true)
const waiting = { ...emptySpeechActivity(), idleSamples: rate * 30 }
assert.equal(shouldStopConversationIdle(waiting, rate, 'pause', true), false)
assert.equal(shouldStopConversationIdle(waiting, rate, 'pause', false), true)
assert.equal(shouldStopConversationIdle(waiting, rate, 'manual', true), true)
let shortReply = emptySpeechActivity()
for (let i = 0; i < 3; i++) shortReply = updateSpeechActivity(shortReply, 0.48, 512, speechDetectionMode('pause', true))
assert.equal(shortReply.voiced, true)
for (let i = 0; i < 110; i++) shortReply = updateSpeechActivity(shortReply, 0.1, 512, speechDetectionMode('pause', true))
assert.equal(shouldAutoSend(shortReply, rate, 'pause'), true)
