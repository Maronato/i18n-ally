import { TextDocument, Position, Range } from 'vscode'
import { ScopeRange } from '../frameworks/base'
import { KeyInDocument } from '../core'
import { regexFindKeys } from '../utils'
import { Global } from './Global'
import { RewriteKeyContext } from './types'
import { Config } from './Config'

export class KeyDetector {
  static getKeyByContent(text: string) {
    const keys = new Set<string>()
    const regs = Global.getUsageMatchRegex()

    for (const reg of regs) {
      (text.match(reg) || [])
        .forEach(key =>
          keys.add(key.replace(reg, '$1')),
        )
    }

    return Array.from(keys)
  }

  static getKeyRange(document: TextDocument, position: Position, dotEnding?: boolean) {
    if (Config.disablePathParsing)
      dotEnding = true

    const regs = Global.getUsageMatchRegex(document.languageId, document.uri.fsPath)
    for (const regex of regs) {
      const range = document.getWordRangeAtPosition(position, regex)
      if (range) {
        const key = document.getText(range).replace(regex, '$1')

        if (dotEnding) {
          if (!key || key.endsWith('.'))
            return { range, key }
        }
        else {
          return { range, key }
        }
      }
    }
  }

  static getKey(document: TextDocument, position: Position, dotEnding?: boolean) {
    const keyRange = KeyDetector.getKeyRange(document, position, dotEnding)
    return keyRange?.key
  }

  static getKeyAndRange(document: TextDocument, position: Position, dotEnding?: boolean) {
    const { range, key } = KeyDetector.getKeyRange(document, position, dotEnding) || {}
    if (!range || !key)
      return
    const end = range.end.character - 1
    const start = end - key.length
    const keyRange = new Range(
      new Position(range.end.line, start),
      new Position(range.end.line, end),
    )
    return {
      range: keyRange,
      key,
    }
  }

  static getKeys(document: TextDocument | string, regs?: RegExp[], dotEnding?: boolean, scopes?: ScopeRange[]): KeyInDocument[] {
    let text = ''
    let rewriteContext: RewriteKeyContext| undefined
    if (typeof document !== 'string') {
      regs = regs ?? Global.getUsageMatchRegex(document.languageId, document.uri.fsPath)
      text = document.getText()
      rewriteContext = {
        targetFile: document.uri.fsPath,
      }
      scopes = scopes || Global.enabledFrameworks.flatMap(f => f.getScopeRange(document) || [])
    }
    else {
      regs = Global.getUsageMatchRegex()
      text = document
    }

    return regexFindKeys(text, regs, dotEnding, rewriteContext, scopes)
  }
}
