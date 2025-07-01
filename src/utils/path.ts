/**
 * UnJS patheを使用した統一的なパス操作ユーティリティ
 * クロスプラットフォーム対応（Windows/POSIX）を提供
 */
import { resolve, dirname, join, normalize, relative, isAbsolute } from 'pathe'
import { homedir } from 'node:os'

/**
 * ホームディレクトリのチルダ展開
 * @param path - 展開するパス
 * @returns 展開されたパス
 */
export function expandPath(path: string): string {
  if (path.startsWith('~/')) {
    return resolve(homedir(), path.slice(2))
  }
  return normalize(path)
}

/**
 * セキュアなパス結合
 * @param paths - 結合するパス
 * @returns 正規化された結合パス
 */
export function securejoin(...paths: string[]): string {
  const joined = join(...paths)
  return normalize(joined)
}

/**
 * パスが指定のベースディレクトリ内にあるか検証
 * @param path - 検証するパス
 * @param basePath - ベースディレクトリ
 * @returns ベースディレクトリ内にある場合true
 */
export function isWithinBase(path: string, basePath: string): boolean {
  const normalizedPath = resolve(path)
  const normalizedBase = resolve(basePath)
  const rel = relative(normalizedBase, normalizedPath)
  
  // 相対パスが..で始まらない場合、ベースディレクトリ内にある
  return !rel.startsWith('..') && !isAbsolute(rel)
}

// patheの関数を再エクスポート（統一的なインポート元として）
export {
  resolve,
  dirname,
  join,
  normalize,
  relative,
  isAbsolute,
  basename,
  extname,
  parse,
  format,
  sep,
  delimiter,
  posix,
  win32
} from 'pathe'

// 追加のユーティリティ関数（pathe/utils から）
export {
  filename,
  normalizeAliases,
  resolveAlias,
  reverseResolveAlias
} from 'pathe/utils'