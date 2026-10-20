import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/coroVozActivity.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { emptySpeechActivity, updateSpeechActivity, pauseReached, shouldAutoSend } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const rate = 16000
const chunk = 1600
let activity = emptySpeechActivity()
for (let i = 0; i < 10; i++) activity = updateSpeechActivity(activity, 0.002, chunk)
assert.equal(activity.voiced, false)
assert.equal(pauseReached(activity, rate), false)
for (let i = 0; i < 10; i++) activity = updateSpeechActivity(activity, 0.025, chunk)
assert.equal(activity.voiced, true)
for (let i = 0; i < 34; i++) activity = updateSpeechActivity(activity, 0.003, chunk)
assert.equal(pauseReached(activity, rate), false)
activity = updateSpeechActivity(activity, 0.003, chunk)
assert.equal(pauseReached(activity, rate), true)
assert.equal(shouldAutoSend(activity, rate, 'pause'), true)
assert.equal(shouldAutoSend(activity, rate, 'manual'), false)

activity = emptySpeechActivity()
for (let i = 0; i < 10; i++) activity = updateSpeechActivity(activity, 0.009, chunk)
for (let i = 0; i < 10; i++) activity = updateSpeechActivity(activity, 0.04, chunk)
for (let i = 0; i < 35; i++) activity = updateSpeechActivity(activity, 0.009, chunk)
assert.equal(pauseReached(activity, rate), true)
