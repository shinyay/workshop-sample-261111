# 検証結果

作業場所: リポジトリルート。報告: `review-input/verify-fix-874445c.md`

## 版の記録

検証直前・直後とも HEAD は `874445ca2c3f6b1041fcfcc6045a240fc013132c`、`git status --short` は次のとおりです。

```text
 M AGENTS.md
 M request_portal/storage.py
 M tests/test_portal.py
?? .github/
?? ac-memo.md
?? quality-memo.md
?? review-input/
```

両時点で `git diff --no-ext-diff --binary HEAD -- request_portal tests` は終了コード 0、SHA-256 は `da5adf6716ab24775c87a1b3e868e895ed4bc5511d9a4d9e8825c2a96dc9b5d3` でした。対象ディレクトリ内に未追跡ファイルはありません。

指定パッチの生 SHA-256 は `f6fb981607b431c5d1a54260e5ce123933cc070319ac8699e673cec96ab16514` です。パッチの改行は CRLF、Git 差分の改行は LF で、生バイト列は異なります。両時点で CRLF を LF に正規化すると、両者の SHA-256 は上記の `da5adf...dc9b5d3` となり、バイト単位で一致しました。

## 実行結果

すべて既存環境を使用し、`--offline --no-sync` で依存の取得・同期を避けました。`PYTHONDONTWRITEBYTECODE=1`、pytest の `-p no:cacheprovider` で作業ツリー内のキャッシュ生成を抑止しました。

| コマンド | 終了コード | 最終行 |
| --- | ---: | --- |
| `uv run --locked --offline --no-sync pytest -p no:cacheprovider tests/test_portal.py -k combined_filters -q` | 0 | `4 passed, 47 deselected in 2.43s` |
| `uv run --locked --offline --no-sync pytest -p no:cacheprovider tests/test_portal.py -q` | 0 | `51 passed in 9.71s` |
| `uv run --locked --offline --no-sync pytest -p no:cacheprovider --ignore=tests/test_reference_patch.py -q` | 0 | `88 passed in 15.81s` |
| `uv run --locked --offline --no-sync ruff check .`（初回） | 2 | `For more information, try '--help'.` |
| `uv run --locked --offline --no-sync ruff format --check .`（初回） | 2 | `For more information, try '--help'.` |
| `uv run --locked --offline --no-sync mypy --cache-dir NUL`（初回） | 2 | `note: please use --show-traceback to print a traceback when reporting a bug` |
| `uv run --locked --offline --no-sync ruff check .`（再実行） | 0 | `All checks passed!` |
| `uv run --locked --offline --no-sync ruff format --check .`（再実行） | 0 | `21 files already formatted` |
| `uv run --locked --offline --no-sync mypy --cache-dir $mypyCache`（再実行） | 0 | `Success: no issues found in 5 source files` |

初回の Ruff はキャッシュ抑止用の `RUFF_NO_CACHE=1` を不正値として拒否したため、再実行では `true` を指定しました。初回の mypy は `NUL` 指定で内部エラーを出したため、再実行では `$mypyCache` にシステムの一時ディレクトリ内の新規パスを指定しました。

## 未実施・影響

- `tests/test_reference_patch.py` は指定どおり除外しました。
- 実ブラウザー確認、デモ DB の変更、依存のインストール・同期は行っていません。テストには一時 DB を使用しました。
- コード・テスト・期待値・設定は変更していません。報告ファイルを検証後に作成しました。
