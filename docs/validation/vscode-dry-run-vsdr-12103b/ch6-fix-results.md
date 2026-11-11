# 6-4 修正後の再レビュー用の記録

## 対象

- 品質演習用コピー。HEAD は `874445ca2c3f6b1041fcfcc6045a240fc013132c`（874445c）。
- コミットしていない変更：`request_portal/storage.py` の1行（条件の結合を AND に）と、`tests/test_portal.py` への追加テスト4ケース。差分は `review-input/fix-diff-874445c.patch`。
- 実行した人：実装担当（VS Code の Copilot、既定の Agent）。下の出力は、その会話のターミナル出力を写したもの。

## 元の指摘と人の判断

1. 高：`storage.py` の OR 結合は AC-04 違反（F1〜F6 で engineering＋pending の期待は F1 だけ）→ 採用。修正範囲は条件の結合だけ。
2. 中：解除リンクが `scoutTheme` を引き継がない → 採用。ただし今回の修正範囲に含めず、別の変更として保留。
3. 中：組み合わせ結果を確かめるテストがない → 採用。追加テスト4ケースで対応。

## 修正前（欠陥版）の追加テスト

コマンド：`uv run --locked --offline pytest tests/test_portal.py -vv -k combined_filters --tb=short`　終了コード：1

```text
tests/test_portal.py::test_combined_filters_on_page[engineering-pending-expected0] FAILED [ 25%]
tests/test_portal.py::test_combined_filters_on_page[corporate-approved-expected1] FAILED [ 50%]
tests/test_portal.py::test_combined_filters_on_api[sales-approved-expected0] FAILED [ 75%]
tests/test_portal.py::test_combined_filters_on_api[design-rejected-expected1] FAILED [100%]
FAILED tests/test_portal.py::test_combined_filters_on_page[engineering-pending-expected0] - AssertionError: assert {'ids': {1, 2, 3, 5}, 'row_count': 4, 'displayed_count': 4, 'values': {5: ['F5', '#005 · 備品購入', '試験用 さくら', 'デザイン部', '確認待ち'], 3: ['F3', '#003 · 備品購入', '試験用 さくら', '営業部', '確認待ち'], 2: ['F2', '#002 · 備品購入', '試験用 さくら', '開発部', '承認済み'], 1: ['F1', '#001 · 備品購入', '試験用 さくら', '開発部', '確認待ち']}, 'empty_state': False} == {'ids': {1}, 'row_count': 1, 'displayed_count': 1, 'values': {1: ['F1', '#001 · 備品購入', '試験用 さくら', '開発部', '確認待ち']}, 'empty_state': False}
FAILED tests/test_portal.py::test_combined_filters_on_page[corporate-approved-expected1] - AssertionError: assert {'ids': {2, 4, 6}, 'row_count': 3, 'displayed_count': 3, 'values': {6: ['F6', '#006 · 備品購入', '試験用 さくら', '営業部', '承認済み'], 4: ['F4', '#004 · 備品購入', '試験用 さくら', '管理部', '差し戻し'], 2: ['F2', '#002 · 備品購入', '試験用 さくら', '開発部', '承認済み']}, 'empty_state': False} == {'ids': set(), 'row_count': 0, 'displayed_count': 0, 'values': {}, 'empty_state': True}
FAILED tests/test_portal.py::test_combined_filters_on_api[sales-approved-expected0] - AssertionError: assert {'ids': {2, 3, 6}, 'item_count': 3, 'count': 3, 'values': {6: {'applicant': '試験用 さくら', 'department': 'sales', 'details': '研修で操作を確認するため、架空の機器を1台購入したいです。', 'id': 6, 'kind': 'equipment', 'status': 'approved', 'title': 'F6'}, 3: {'applicant': '試験用 さくら', 'department': 'sales', 'details': '研修で操作を確認するため、架空の機器を1台購入したいです。', 'id': 3, 'kind': 'equipment', 'status': 'pending', 'title': 'F3'}, 2: {'applicant': '試験用 さくら', 'department': 'engineering', 'details': '研修で操作を確認するため、架空の機器を1台購入したいです。', 'id': 2, 'kind': 'equipment', 'status': 'approved', 'title': 'F2'}}, 'timestamps_present': True} == {'ids': {6}, 'item_count': 1, 'count': 1, 'values': {6: {'title': 'F6', 'applicant': '試験用 さくら', 'department': 'sales', 'kind': 'equipment', 'details': '研修で操作を確認するため、架空の機器を1台購入したいです。', 'id': 6, 'status': 'approved'}}, 'timestamps_present': True}
FAILED tests/test_portal.py::test_combined_filters_on_api[design-rejected-expected1] - AssertionError: assert {'ids': {4, 5}, 'item_count': 2, 'count': 2, 'values': {5: {'applicant': '試験用 さくら', 'department': 'design', 'details': '研修で操作を確認するため、架空の機器を1台購入したいです。', 'id': 5, 'kind': 'equipment', 'status': 'pending', 'title': 'F5'}, 4: {'applicant': '試験用 さくら', 'department': 'corporate', 'details': '研修で操作を確認するため、架空の機器を1台購入したいです。', 'id': 4, 'kind': 'equipment', 'status': 'rejected', 'title': 'F4'}}, 'timestamps_present': True} == {'ids': set(), 'item_count': 0, 'count': 0, 'values': {}, 'timestamps_present': True}
====================== 4 failed, 47 deselected in 2.40s =======================
```

## 修正の直前（修正を依頼した会話の冒頭、storage.py を編集する前）

訂正：最初の版では、この記録を誤って「修正後」の欄に入れていました。会話ログの時刻順では、この確認のあとに storage.py を編集し、その後に下の「修正後」の確認を実行しています。

- `git status --short; git rev-parse HEAD; git diff -- request_portal/storage.py`　終了コード：0

```text
s --short; git rev-parse HEAD; git diff -- request_portal/storage.py
 M AGENTS.md
 M tests/test_portal.py
?? .github/
?? ac-memo.md
?? quality-memo.md
?? review-input/
874445ca2c3f6b1041fcfcc6045a240fc013132c
```

## 修正後（storage.py を編集したあと）

- `uv run --locked --offline pytest tests/test_portal.py -q -k combined_filters`　終了コード：0
  - 最終行：4 passed, 47 deselected in 1.85s
- `uv run --locked --offline pytest tests/test_portal.py -q`　終了コード：0
  - 最終行：51 passed in 7.31s
- `uv run --locked --offline pytest --ignore=tests/test_reference_patch.py -q`　終了コード：0
  - 最終行：88 passed in 11.28s
- `uv run --locked --offline ruff check .`　終了コード：0
  - 最終行：All checks passed!
- `uv run --locked --offline ruff format --check .`　終了コード：0
  - 最終行：20 files already formatted
- `uv run --locked --offline mypy`　終了コード：0
  - 最終行：Success: no issues found in 5 source files
- `git rev-parse HEAD; git status --short; git diff --stat -- request_portal tests; git diff -- request_portal/storage.py`　終了コード：0

```text
 -- request_portal/storage.py
874445ca2c3f6b1041fcfcc6045a240fc013132c
 M AGENTS.md
 M request_portal/storage.py
 M tests/test_portal.py
?? .github/
?? ac-memo.md
?? quality-memo.md
?? review-input/
 request_portal/storage.py |   2 +-
 tests/test_portal.py      | 172 ++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 173 insertions(+), 1 deletion(-)
diff --git a/request_portal/storage.py b/request_portal/storage.py
index 99648a4..d68e613 100644
--- a/request_portal/storage.py
+++ b/request_portal/storage.py
@@ -104,7 +104,7 @@ def list_requests(path: Path, *, department: str = "", status: str = "") -> list
     if status:
         clauses.append("status = ?")
         parameters.append(status)
-    where = " WHERE " + " OR ".join(clauses) if clauses else ""
+    where = " WHERE " + " AND ".join(clauses) if clauses else ""
     with connection(path) as database:
         rows = database.execute(
             f"SELECT {_COLUMNS} FROM requests{where} ORDER BY created_at DESC, id DESC",
```


## 同じ版での再確認

上の記録は会話ログから写したもので、実行時の差分全文はありません。そのため、実行担当（検証Skill）に、確認の直前と直後の版を記録したうえで同じ確認を再実行してもらいました。結果は `review-input/verify-fix-874445c.md` です。

- `fix-diff-874445c.patch` は PowerShell 経由で保存したため、改行が CRLF です。改行を LF にそろえると、作業版の差分と一致しました。

## 未確認

- 実ブラウザーでの確認、`tests/test_reference_patch.py` の2件（講師用の完成例パッチの検品。アプリのコードを変えたコピーでは必ず失敗するため除外）。
- 解除リンクの配色（指摘2）は未修正。
