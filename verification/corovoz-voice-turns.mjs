import { withChromium } from './chromium-session.mjs'

await withChromium(async browser => {
  const tab = await browser.tab('http://127.0.0.1:5189/verification/corovoz-voice-turns.html')
  await tab.waitFor("document.querySelector('#results')?.dataset.result", 70000)
  const results = await tab.evaluate("document.querySelector('#results').textContent")
  if (await tab.evaluate("document.querySelector('#results').dataset.result !== 'passed'")) throw new Error(results)
  console.log(results)
})
