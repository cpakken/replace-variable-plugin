import { parse } from 'acorn'
import { type Node, walk } from 'estree-walker'
import { isMatch } from 'picomatch'
import type { Plugin } from 'vite'

export interface ReplaceVariablePluginConfig {
  globs?: string[]
  variableName: string
  replacement: string
}

export default function replaceVariablePlugin({
  globs,
  variableName,
  replacement,
}: ReplaceVariablePluginConfig): Plugin {
  return {
    name: 'replaceVariablePlugin',
    apply: 'build',
    renderChunk(code, chunk) {
      if (
        globs &&
        chunk.facadeModuleId &&
        !globs.some((glob) => isMatch(chunk.facadeModuleId!, glob))
      ) {
        return null
      }

      const replaced = replaceVariable(code, variableName, replacement)

      if (replaced) {
        console.log('REPLACED __vitePreload:', chunk.facadeModuleId, chunk.fileName)
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

  // console.log(code.slice(startIndex, endIndex))

  return `${code.slice(0, startIndex)} = ${replacement}${code.slice(endIndex)}`
}
