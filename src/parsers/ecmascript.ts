import child_process from 'child_process'
import path from 'path'
import { inspect } from 'util'
import { Parser } from './base'
import { Config, Global } from '~/core'

const LanguageIds = {
  js: 'javascript',
  ts: 'typescript',
} as const

const LanguageExts = {
  js: 'm?js',
  ts: 'ts',
} as const

export class EcmascriptParser extends Parser {
  readonly readonly = false

  constructor(public readonly id: 'js'|'ts' = 'js') {
    super([LanguageIds[id]], LanguageExts[id])
  }

  async parse() {
    return {}
  }

  async dump(object: object, sort: boolean): Promise<string> {
    return `export default ${inspect(object, { depth: null, sorted: sort })} as const\n`
  }

  async load(filepath: string) {
    const loader = path.resolve(Config.extensionPath!, 'assets/loader.js')
    const tsNode = Config.parsersTypescriptTsNodePath
    const dir = Global.rootpath
    const compilerOptions = {
      importHelpers: false,
      allowJs: true,
      module: 'commonjs',
      ...Config.parsersTypescriptCompilerOption,
    }
    const options = JSON.stringify(compilerOptions).replace(/"/g, '\\"')

    return new Promise<any>((resolve, reject) => {
      const cmd = `${tsNode} --dir "${dir}" --transpile-only --compiler-options "${options}" "${loader}" "${filepath}"`
      // eslint-disable-next-line no-console
      console.log(`[i18n-ally] spawn: ${cmd}`)
      child_process.exec(cmd, (err, stdout) => {
        if (err)
          return reject(err)
        try {
          resolve(JSON.parse(stdout.trim()))
        }
        catch (e) {
          reject(e)
        }
      })
    })
  }
}
