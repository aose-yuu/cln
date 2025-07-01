/**
 * patheを使用した設定管理モジュールの実装例
 */
import { promises as fs } from 'fs'
import { homedir } from 'os'
import { join, resolve } from 'pathe'  // patheを使用
import type { Settings } from '../types.js'
import { validateGitUrl, sanitizeRepositoryName } from './security.js'
import { expandPath } from './path.js'  // 新しいpathユーティリティを使用

const CONFIG_DIR = join(homedir(), '.config', 'cln')
const SETTINGS_FILE = join(CONFIG_DIR, 'settings.json')

const DEFAULT_SETTINGS: Settings = {
  outDir: join(homedir(), 'works'),  // patheのjoinを使用
  repositories: {}
}

export async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true })
  } catch (error) {
    // Directory already exists or other error
  }
}

export async function loadSettings(): Promise<Settings> {
  await ensureConfigDir()
  
  try {
    const content = await fs.readFile(SETTINGS_FILE, 'utf-8')
    const loaded = JSON.parse(content)
    
    // パスを正規化して返す
    return {
      ...DEFAULT_SETTINGS,
      ...loaded,
      outDir: loaded.outDir ? expandPath(loaded.outDir) : DEFAULT_SETTINGS.outDir
    }
  } catch (error) {
    // File doesn't exist, return defaults
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await ensureConfigDir()
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), { mode: 0o600 })
}

export async function addRepository(name: string, url: string): Promise<void> {
  // Validate and sanitize inputs
  const sanitizedName = sanitizeRepositoryName(name)
  const validatedUrl = validateGitUrl(url)
  
  const settings = await loadSettings()
  settings.repositories[sanitizedName] = validatedUrl
  await saveSettings(settings)
}

export async function removeRepository(name: string): Promise<void> {
  const settings = await loadSettings()
  delete settings.repositories[name]
  await saveSettings(settings)
}

export async function getRepositoryUrl(name: string): Promise<string | undefined> {
  const settings = await loadSettings()
  return settings.repositories[name]
}

export async function listRepositories(): Promise<Array<{ name: string; url: string }>> {
  const settings = await loadSettings()
  return Object.entries(settings.repositories).map(([name, url]) => ({ name, url }))
}

export function getSettingsPath(): string {
  return SETTINGS_FILE
}

// expandPathは新しいpath.tsモジュールから使用