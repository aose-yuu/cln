#!/usr/bin/env node
/**
 * Cittyを使用したCLN CLIの実装例
 * React/Inkを完全に削除し、軽量なpromptsライブラリを使用
 */
import { defineCommand, runMain } from 'citty'
import prompts from 'prompts'
import { consola } from 'consola'
import { 
  addRepository, 
  listRepositories, 
  getRepositoryUrl, 
  removeRepository,
  getSettingsPath 
} from './utils/settings.js'
import { 
  cloneRepository, 
  getClonePath, 
  ensureParentDirectory,
  directoryExists,
  listClonedRepositories,
  removeDirectory
} from './utils/git.js'
import { writeCdPath } from './utils/shell.js'
import { open } from 'open'

// メインコマンドの定義
const main = defineCommand({
  meta: {
    name: 'cln',
    version: '1.0.0',
    description: 'A beautiful Git repository management CLI tool'
  },
  async run() {
    // インタラクティブモード（引数なしで実行された場合）
    const repos = await listRepositories()
    
    if (repos.length === 0) {
      consola.error('No repositories configured. Use "cln add <name> <url>" to add one.')
      process.exit(1)
    }

    // リポジトリ選択
    const { repository } = await prompts({
      type: 'select',
      name: 'repository',
      message: 'Select a repository to clone',
      choices: repos.map(r => ({
        title: `${r.name} (${r.url})`,
        value: r
      }))
    })

    if (!repository) {
      consola.info('Cancelled')
      return
    }

    // ブランチ名入力
    const { branch } = await prompts({
      type: 'text',
      name: 'branch',
      message: `Enter branch name for ${repository.name}`,
      initial: 'main'
    })

    if (!branch) {
      consola.info('Cancelled')
      return
    }

    // クローン処理
    const spinner = consola.withTag('clone').start('Cloning repository...')
    
    try {
      const clonePath = await getClonePath(repository.name, branch)
      
      // 既存ディレクトリチェック
      if (await directoryExists(clonePath)) {
        spinner.fail(`Directory already exists: ${clonePath}`)
        process.exit(1)
      }

      await ensureParentDirectory(clonePath)
      const result = await cloneRepository(repository.url, clonePath, branch)
      
      if (result.success) {
        spinner.success(result.message)
        writeCdPath(clonePath)
        process.exit(0)
      } else {
        spinner.fail(result.error)
        process.exit(1)
      }
    } catch (error) {
      spinner.fail(`Failed to clone: ${error.message}`)
      process.exit(1)
    }
  },
  subCommands: {
    // add コマンド
    add: defineCommand({
      meta: {
        description: 'Add a new repository to the configuration'
      },
      args: {
        name: {
          type: 'positional',
          description: 'Repository name',
          required: true
        },
        url: {
          type: 'positional',
          description: 'Git repository URL',
          required: true
        }
      },
      async run({ args }) {
        const spinner = consola.withTag('add').start(`Adding repository ${args.name}...`)
        
        try {
          await addRepository(args.name, args.url)
          spinner.success(`Successfully added repository '${args.name}' with URL: ${args.url}`)
        } catch (error) {
          spinner.fail(error.message)
          process.exit(1)
        }
      }
    }),

    // create コマンド
    create: defineCommand({
      meta: {
        description: 'Clone a specific repository and branch'
      },
      args: {
        repository: {
          type: 'positional',
          description: 'Repository name',
          required: true
        },
        branch: {
          type: 'positional',
          description: 'Branch name',
          required: true
        }
      },
      async run({ args }) {
        const spinner = consola.withTag('create').start('Cloning repository...')
        
        try {
          const url = await getRepositoryUrl(args.repository)
          if (!url) {
            spinner.fail(`Repository '${args.repository}' not found`)
            process.exit(1)
          }

          const clonePath = await getClonePath(args.repository, args.branch)
          
          if (await directoryExists(clonePath)) {
            spinner.fail(`Directory already exists: ${clonePath}`)
            process.exit(1)
          }

          await ensureParentDirectory(clonePath)
          const result = await cloneRepository(url, clonePath, args.branch)
          
          if (result.success) {
            spinner.success(result.message)
            writeCdPath(clonePath)
            process.exit(0)
          } else {
            spinner.fail(result.error)
            process.exit(1)
          }
        } catch (error) {
          spinner.fail(`Failed to clone: ${error.message}`)
          process.exit(1)
        }
      }
    }),

    // list コマンド
    list: defineCommand({
      meta: {
        description: 'List all cloned repositories'
      },
      async run() {
        const repos = await listClonedRepositories()
        
        if (repos.length === 0) {
          consola.info('No cloned repositories found.')
          return
        }

        // リポジトリごとにグループ化
        const grouped = repos.reduce((acc, repo) => {
          if (!acc[repo.repository]) {
            acc[repo.repository] = []
          }
          acc[repo.repository].push(repo)
          return acc
        }, {} as Record<string, typeof repos>)

        // 表示
        Object.entries(grouped).forEach(([repoName, branches]) => {
          console.log(`📁 ${repoName}`)
          branches.forEach((branch, index) => {
            const isLast = index === branches.length - 1
            const prefix = isLast ? '  └─' : '  ├─'
            console.log(`${prefix} ${branch.branch} → ${branch.path}`)
          })
        })
      }
    }),

    // delete コマンド
    delete: defineCommand({
      meta: {
        description: 'Delete a branch directory'
      },
      args: {
        branch: {
          type: 'positional',
          description: 'Branch name to delete',
          required: true
        }
      },
      async run({ args }) {
        const repos = await listClonedRepositories()
        const matches = repos.filter(r => r.branch === args.branch)
        
        if (matches.length === 0) {
          consola.error(`No directories found for branch: ${args.branch}`)
          process.exit(1)
        }

        // 削除対象を表示
        console.log('The following directories will be deleted:')
        matches.forEach(m => console.log(`  - ${m.path}`))

        // 確認プロンプト
        const { confirm } = await prompts({
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to delete these directories?',
          initial: false
        })

        if (!confirm) {
          consola.info('Cancelled')
          return
        }

        // 削除実行
        const spinner = consola.withTag('delete').start('Deleting directories...')
        let hasError = false

        for (const match of matches) {
          const result = await removeDirectory(match.path)
          if (!result.success) {
            consola.error(`Failed to delete ${match.path}: ${result.error}`)
            hasError = true
          }
        }

        if (hasError) {
          spinner.fail('Some directories could not be deleted')
          process.exit(1)
        } else {
          spinner.success('Successfully deleted all directories')
        }
      }
    }),

    // config コマンド
    config: defineCommand({
      meta: {
        description: 'Open the configuration file in your default editor'
      },
      async run() {
        const settingsPath = getSettingsPath()
        consola.info(`Opening ${settingsPath}...`)
        
        try {
          await open(settingsPath)
        } catch (error) {
          consola.error(`Failed to open config file: ${error.message}`)
          process.exit(1)
        }
      }
    })
  }
})

// CLIを実行
runMain(main)