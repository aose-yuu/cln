# CLN リファクタリング作業計画書

## 概要

本計画書は、CLNプロジェクトのReact/Ink依存を削除し、軽量な代替実装に移行するための詳細な作業手順を定めたものです。

## 目標

1. **主目標**: React/Inkを完全に削除し、軽量な代替ライブラリに移行
2. **サイズ削減目標**: 2.9MB → 50KB以下（95%以上削減）
3. **UX維持**: 現在のユーザー体験を95%以上維持
4. **互換性**: 既存のシェル関数との完全な互換性を維持

## 前提条件

- 既存のテストは限定的なため、動作確認は手動テストを重視
- セキュリティ実装（security.ts）は変更しない
- Git操作とシェル統合の基本機能は維持する

## Phase 1: 準備作業（推定: 2時間）

### 1.1 現状の動作確認とバックアップ

```bash
# 現在の動作を記録
cln list > current_behavior.txt
git branch backup/before-refactoring
git checkout -b feature/remove-ink
```

### 1.2 依存関係の追加

```bash
npm install prompts ora picocolors
npm install --save-dev @types/prompts
```

### 1.3 作業前チェックリスト

- [ ] 全コマンドの動作確認（add, create, list, delete, config）
- [ ] インタラクティブモードの動作確認
- [ ] エラーケースの動作確認
- [ ] 現在の見た目をスクリーンショットで記録

## Phase 2: コア機能の移行（推定: 4-6時間）

### 2.1 新しいCLIエントリーポイントの作成

**作業内容**: `src/cli-new.ts` を作成し、React不使用のCLI実装を作成

```typescript
// src/cli-new.ts の基本構造
import prompts from 'prompts';
import ora from 'ora';
import pc from 'picocolors';
import { listRepositories, getRepositoryUrl } from './utils/settings.js';
import { cloneRepository, getClonePath, ensureParentDirectory, directoryExists } from './utils/git.js';
import { writeCdPath } from './utils/shell.js';

export async function runInteractiveMode() {
  // React版と同じ流れを prompts で実装
}
```

**判断ポイント**:
- promptsの選択UIが期待通り動作するか
- キャンセル処理が適切に行われるか

### 2.2 各コマンドの書き換え

#### 作業順序（依存関係の少ない順）:

1. **config.ts** (最も簡単、Reactなし)
   - そのまま使用可能

2. **add command** 
   ```typescript
   // src/commands/add-new.ts
   export async function addCommand(name: string, url: string) {
     const spinner = ora(`Adding repository ${name}...`).start();
     try {
       await addRepository(name, url);
       spinner.succeed(pc.green(`✅ Successfully added repository '${name}'`));
     } catch (error) {
       spinner.fail(pc.red(`❌ Error: ${error.message}`));
       process.exit(1);
     }
   }
   ```

3. **list command**
   ```typescript
   // ツリー表示の実装
   console.log(pc.cyan(`📁 ${repoName}`));
   branches.forEach((branch, index) => {
     const isLast = index === branches.length - 1;
     const prefix = isLast ? '  └─' : '  ├─';
     console.log(`${prefix} ${pc.yellow(branch.branch)} → ${pc.gray(branch.path)}`);
   });
   ```

4. **create command**
   - クローン処理のスピナー表示
   - エラーハンドリング

5. **delete command**
   - 確認プロンプトの実装
   - 複数削除の処理

### 2.3 コンポーネントの置き換え対応表

| 旧コンポーネント | 新実装方法 |
|-----------------|-----------|
| `<SelectInput>` | `prompts({ type: 'select' })` |
| `<TextInput>` | `prompts({ type: 'text' })` |
| `<Spinner>` | `ora().start()` |
| `<Text color="...">` | `pc.green()`, `pc.red()` など |
| `<Box>` | 通常の `console.log` with インデント |
| `<ErrorDisplay>` | エラー表示関数 |

## Phase 3: 統合とテスト（推定: 2-3時間）

### 3.1 エントリーポイントの切り替え

```typescript
// src/index.ts の更新
#!/usr/bin/env node
import { program } from 'commander';
import { runInteractiveMode } from './cli-new.js';
import { addCommand } from './commands/add-new.js';
// ... 他のコマンドも同様
```

### 3.2 段階的な動作確認

**チェックリスト**:
- [ ] `cln` (インタラクティブモード)
- [ ] `cln add <name> <url>`
- [ ] `cln create <repo> <branch>`
- [ ] `cln list`
- [ ] `cln delete <branch>`
- [ ] `cln config`

### 3.3 シェル統合の確認

```bash
# cdが正しく動作するか確認
cln create test-repo test-branch
# 自動的にディレクトリに移動するはず
```

## Phase 4: クリーンアップ（推定: 1-2時間）

### 4.1 不要なファイルの削除

```bash
# 削除対象
rm -rf src/components/
rm src/cli.tsx
rm src/commands/*.tsx
# 各コマンドの.tsx版を削除
```

### 4.2 依存関係の削除

```bash
npm uninstall react ink ink-select-input ink-spinner ink-text-input
npm uninstall @types/react
```

### 4.3 TypeScript設定の更新

```json
// tsconfig.json から jsx 関連の設定を削除
{
  "compilerOptions": {
    // "jsx": "react" を削除
  }
}
```

## Phase 5: オプション - Windows対応（必要に応じて）

### 5.1 pathe導入の判断

**判断基準**:
- Windowsユーザーからの要望がある
- クロスプラットフォーム対応が必須要件

**導入する場合**:
```bash
npm install pathe
```

その後、`src/utils/path.ts` の実装例を使用してパス操作を統一。

**導入しない場合**:
最小限の実装を `src/utils/git.ts` に追加：
```typescript
function normalizePathForGit(path: string): string {
  return path.replace(/\\/g, '/');
}
```

## 注意事項

### 実装時の重要ポイント

1. **エラーメッセージの一貫性**
   - 既存と同じ形式を維持: `❌ Error: ${message}`
   - 成功メッセージも同様: `✅ Successfully...`

2. **色の使用規則**
   - 成功: 緑 (`pc.green`)
   - エラー: 赤 (`pc.red`)
   - 警告/ブランチ名: 黄色 (`pc.yellow`)
   - リポジトリ名: シアン (`pc.cyan`)
   - パス情報: グレー (`pc.gray`)

3. **プロセス終了**
   - 成功時: `process.exit(0)`
   - エラー時: `process.exit(1)`
   - タイムアウト不要（削除）

4. **キャンセル処理**
   - promptsでユーザーがキャンセルした場合は `Cancelled` を表示
   - エラーとは区別する

### テスト方法

```bash
# 基本動作テスト
npm run build
npm link  # ローカルでグローバルインストール

# 各コマンドのテスト
cln add test-repo https://github.com/example/repo.git
cln list
cln create test-repo main
cln delete main
cln config
```

### トラブルシューティング

1. **promptsが動作しない場合**
   - TTY環境か確認
   - CI環境では `CI=true` で非対話モードに

2. **色が表示されない場合**
   - `NO_COLOR` 環境変数を確認
   - picocolorsは自動検出するが、強制する場合は `FORCE_COLOR=1`

3. **パス関連のエラー**
   - Windows環境の場合は手動正規化を追加
   - Git操作前にパスを変換

## 成果物の確認

### 最終チェックリスト

- [ ] バンドルサイズが50KB以下
- [ ] すべてのコマンドが正常動作
- [ ] シェル統合（cd機能）が動作
- [ ] エラーハンドリングが適切
- [ ] 見た目が大きく変わっていない

### パフォーマンス測定

```bash
# 起動時間の測定
time cln --version

# バンドルサイズの確認
npm run build
du -sh dist/
```

## 参考資料

- 分析結果: `UX_COMPARISON_ANALYSIS.md`
- 実装例: `src/cli-citty-example.ts`（cittyは使わないが、フローの参考に）
- セキュリティ考慮事項: `src/utils/security.ts`

## 期待される成果

1. **サイズ**: 2.9MB → <50KB（95%以上削減）
2. **起動時間**: 大幅に高速化
3. **保守性**: Reactの知識不要、シンプルなコード
4. **互換性**: 既存の使用方法を100%維持

---

この計画書に従って作業を進めることで、リスクを最小限に抑えながら、CLNの大幅な軽量化を実現できます。各フェーズで動作確認を行い、問題があれば随時調整してください。