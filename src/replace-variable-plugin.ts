import { parse } from 'acorn'
import { type Node, walk } from 'estree-walker'
import MagicString from 'magic-string'
import path from 'path'
import pm from 'picomatch'
import { type Plugin, normalizePath } from 'vite'

export interface ReplaceVariablePluginConfig {
  globs?: string[]
  varName: string
  replacement: string
}

export function replaceVariablePlugin({
  globs,
  varName,
  replacement,
}: ReplaceVariablePluginConfig): Plugin {
  return {
    name: 'replaceVariablePlugin',
    apply: 'build',
    renderChunk(code, chunk) {
      if (globs && chunk.facadeModuleId) {
        const { facadeModuleId } = chunk

        const absoluteGlobs = globs.map((glob) =>
          normalizePath(path.isAbsolute(glob) ? glob : path.resolve(process.cwd(), glob))
        )

        if (!absoluteGlobs.some((glob) => pm(glob)(facadeModuleId))) {
          // console.log('SKIPPED:', absoluteGlobs, chunk.facadeModuleId)
          return null
        }
      }

      const replaced = replaceVariable(code, varName, replacement)

      if (replaced) {
        console.log(`REPLACED ${varName}:`, chunk.facadeModuleId, chunk.fileName)
      }

      return replaced
    },
  }
}

export function replaceVariable(code: string, varName: string, replacement: string) {
  const ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module' }) as unknown as Node

  let startIndex = -1
  let endIndex = -1

  walk(ast, {
    enter(node) {
      if (
        node.type === 'VariableDeclarator' &&
        node.id.type === 'Identifier' &&
        node.id.name === varName
      ) {
        // console.log('START:', startIndex, node.id)
        // startIndex = (node as any).start
        startIndex = (node as any).id.end
        endIndex = (node as any).end
        this.skip() // Skip traversing this node's children
      }
    },
  })

  if (startIndex === -1 || endIndex === -1) {
    return null
  }

  const s = new MagicString(code)

  // console.log(code.slice(startIndex, endIndex))
  // return `${code.slice(0, startIndex)} = ${replacement}${code.slice(endIndex)}`
  s.overwrite(startIndex, endIndex, ` = ${replacement}`)

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  }
}
