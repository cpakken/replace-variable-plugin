import { test } from 'bun:test'
import { replaceVariable } from './replace-variable-plugin'

test('vite preload regex', async () => {
  const code = await Bun.file(__dirname + '/code.txt').text()
  const preloadCode = replaceVariable(code, '__vitePreload', `(fn) => fn()`)

  console.log('VITE PRELOAD:', preloadCode)
})
