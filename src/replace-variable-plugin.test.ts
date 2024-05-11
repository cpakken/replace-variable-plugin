import path from 'path'
import { test } from 'bun:test'
import { replaceVariable } from './replace-variable-plugin'
import picomatch from 'picomatch'

test.skip('vite preload regex', async () => {
  const code = await Bun.file(__dirname + '/code.txt').text()
  const preloadCode = replaceVariable(code, '__vitePreload', `(fn) => fn()`)

  console.log('VITE PRELOAD:', preloadCode?.code)
})

test('picomatch', () => {
  const glob = 'src/content/**/*.ts'

  const isMatch = picomatch(glob)(
    'C:/Users/ckwon/code/projects/extravideocontrols2/extension/src/content/index.ts'
  )

  console.log('IS MATCH:', isMatch)
})
