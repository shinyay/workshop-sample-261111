# 本編作業版の検証結果

- 対象: HEAD `a352d732e7aca85c9ba74e1fb037d0e194a84818` と未コミットの作業版
- 作業場所: リポジトリのルート
- 検証前後でHEAD、以下の状態、および対象差分のハッシュは一致。
- 状態は `git -c core.quotepath=false status --short --untracked-files=all` で取得。対象外の既存変更も含む。

```text
 M AGENTS.md
 M README.md
 M request_portal/__init__.py
 M request_portal/static/portal.css
 M request_portal/storage.py
 M request_portal/templates/base.html
 M request_portal/templates/list.html
 M tests/test_portal.py
?? .github/agents/portal-reviewer.agent.md
?? .github/instructions/tests.instructions.md
?? .github/skills/verify-portal/SKILL.md
?? ac-memo.md
?? plan-memo.md
?? tests/test_filtering.py
```

- 検証前・後の追跡済み差分SHA-256: `e03908da1c47d3ca992fb2d369f14712f627b39a934a46119a4710665643ddf1`
- 検証前・後の新規ファイル `tests/test_filtering.py` のSHA-256: `c3fc2387ec8037cd478d65a34e34fdc5baad00a0cfae68bbf5793ffa92c7d9e2`
- 追跡済み差分は `git -c core.quotepath=false diff --binary --no-ext-diff HEAD -- request_portal tests README.md` の出力バイト列をハッシュ化。新規ファイルは対象パス内の非ignored未追跡ファイルを列挙し、ファイルの内容をハッシュ化。

## 実行結果

`PYTHONDONTWRITEBYTECODE=1` を設定し、依存の同期・ネットワーク接続を抑止して実行。終了コードと最終行は各コマンドのもの。

| コマンド | 終了コード | 最終行 |
| --- | ---: | --- |
| `uv run --locked --offline --no-sync --no-cache pytest -p no:cacheprovider tests/test_filtering.py -q` | 0 | `66 passed in 8.42s` |
| `uv run --locked --offline --no-sync --no-cache pytest -p no:cacheprovider tests/test_portal.py -q` | 0 | `47 passed in 7.36s` |
| `uv run --locked --offline --no-sync --no-cache pytest -p no:cacheprovider --ignore=tests/test_reference_patch.py -q` | 0 | `150 passed in 27.06s` |
| `uv run --locked --offline --no-sync --no-cache ruff check --no-cache .` | 0 | `All checks passed!` |
| `uv run --locked --offline --no-sync --no-cache ruff format --no-cache --check .` | 0 | `21 files already formatted` |
| `uv run --locked --offline --no-sync --no-cache mypy --cache-dir NUL` | 2 | `note: please use --show-traceback to print a traceback when reporting a bug` |
| `uv run --locked --offline --no-sync --no-cache mypy --cache-dir NUL --show-traceback` | 2 | `note: use --pdb to drop into pdb` |
| `uv run --locked --offline --no-sync --no-cache mypy --cache-dir <RUN_ROOT>\tmp\verify-portal-mypy-6n1w3w64` | 0 | `Success: no issues found in 5 source files` |

mypyの最初の2回は `NUL\3.13` の作成時に `FileNotFoundError: [WinError 3]` が発生。ワークスペース外の一時ディレクトリをキャッシュ先にした再実行は成功し、一時ディレクトリは削除した。

## 未実施

- `tests/test_reference_patch.py`: 依頼に従い全体テストから除外。作業版では開始版向けパッチの検品に適さない。
- 実ブラウザー確認、デモDBの操作: 依頼に従い未実施。テストには一時DBを使用。
- コード、テスト、期待値、設定の変更と依存の同期: 実施していない。
