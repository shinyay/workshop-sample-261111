# 第8章 A/Bの原記録の要約（試走担当がCLIの記録から集計。実行順はA→B）

## 実行条件
- 条件は .rehearsal/ch8-ab-conditions.md のとおりで、実行前に記録した。依頼文の違いは、Bの「関連ファイル」の1行だけ。
- 判断者役は、残る条件差3点（実行順、サービス側のキャッシュ、Aの結果を見てからBを実行）を制約として残したまま実行を認めた。

## 段階ごとの品質確認
| 段階 | 対象 | pytest（--ignore=tests/test_reference_patch.py） | ruff check／format／mypy | ACごとの照合（試走担当の道具。2種類のデータで62件） |
| --- | --- | --- | --- | --- |
| 開始版の不具合の確認（準備時） | ea036e3 | 23 failed / 111 passed（想定どおりの失敗） | 成功 | 44件が欠陥を検出 |
| Aの修正後 | ea036e3＋Aの差分 | 134 passed | 成功 | 0件不一致 |
| Bの修正後 | ea036e3＋Bの差分 | 134 passed | 成功 | 0件不一致 |

- Aの修正後とBの修正後は、試走担当が別に再実行した結果。各条件の最終コードに対応する。
- A・Bの差分はどちらも request_portal/__init__.py の1行（count を全申請の合計から len(records) へ）。差分のハッシュは同じ（384d7462…）。

## 負担の記録（CLI 1.0.98 の使用量出力。範囲は各会話の開始から終了まで）
| 指標 | A | B |
| --- | --- | --- |
| 結果 | 成功（品質確認4件とも終了コード0） | 成功（同じ） |
| 所要時間（CLIの起動から終了） | 97.7秒 | 61.7秒 |
| モデルの応答時間の合計（apiMs） | 37.2秒 | 32.3秒 |
| AIクレジット | 21.26 | 17.67 |
| プレミアムリクエスト | 15 | 15 |
| 入力トークンの総数 | 151,181 | 150,044 |
| 　うちキャッシュ読み込み | 127,046 | 131,520 |
| 　うちキャッシュ書き込み | 23,454 | 17,843 |
| 　うちキャッシュなし | 681 | 681 |
| 出力トークン（うち推論） | 3,358（738） | 2,923（509） |
| ツール呼び出し（失敗） | 15回（0回） | 14回（0回） |
| 関連ファイル（__init__.py）を最初に開いた手番 | 3手目 | 3手目 |
| 読んだファイル | __init__.py、test_filtering.py、verify-portal の SKILL.md | 同じ |
| 修正前にテストを実行して失敗を確かめたか | していない | していない |
| 人の介入 | なし（承認・ヒント・追加説明なし） | なし |

- 入力トークンの総数は、キャッシュ読み込み・書き込み・キャッシュなしの合計（681＋127,046＋23,454＝151,181）。内訳を総数に重ねて足していない。
- これはCLIでの測定で、VS Codeでの測定ではない。料金の換算はしていない。

### A のツール呼び出し（順番どおり）
1. powershell:  git --no-pager log --oneline -1; git --no-pager status --short; Get-Content .rehearsal\ac.md; Get-Content .github\instructions\tests.inst
2. grep: count|total|summary|def list_requests|def _list|status_counts
3. view: request_portal\__init__.py
4. grep: \["count"\]|"count"|件を表示
5. edit: request_portal\__init__.py
6. view: tests\test_filtering.py
7. grep: 申請総数|summary|すべての申請の集計
8. glob: .github\skills\**\SKILL.md
9. view: tests\test_filtering.py
10. view: .github\skills\verify-portal\SKILL.md
11. powershell:  uv run --locked pytest --ignore=tests/test_reference_patch.py -q
12. powershell:  uv run --locked ruff check .
13. powershell:  uv run --locked ruff format --check .
14. powershell:  uv run --locked mypy
15. powershell:  git --no-pager diff; git --no-pager status --short

### B のツール呼び出し（順番どおり）
1. powershell:  git --no-pager log --oneline -1; git --no-pager status --short; Get-Content .rehearsal\ac.md; Get-Content .github\instructions\tests.inst
2. grep: count|total|def list_requests|def summar
3. view: request_portal\__init__.py
4. grep: \"count\"|result-count|件を表示
5. edit: request_portal\__init__.py
6. view: tests\test_filtering.py
7. glob: .github\skills\**\SKILL.md
8. view: .github\skills\verify-portal\SKILL.md
9. powershell:  git --no-pager diff
10. powershell:  uv run --locked pytest --ignore=tests/test_reference_patch.py -q
11. powershell:  uv run --locked ruff check .
12. powershell:  uv run --locked ruff format --check .
13. powershell:  uv run --locked mypy
14. powershell:  git --no-pager status --short


## 実装担当の報告（原文）
### A
API の `count` を修正し、AC-08 を満たすようにしました。指定の確認4件はすべて終了コード0です。コミットはしていません。

**対象版:** `ea036e3`。作業前の `git status` に差分はなく、作業後は `request_portal/__init__.py` の1件だけが変更されています。

**原因:** `/api/requests` の `count` が、絞り込み後の一覧ではなく全申請の集計（`status_counts` の合計）を返していました。画面の結果件数は、もともと絞り込み後の一覧の件数（`records|length`）でした。全体集計の表示も変えていません。

**差分:** `request_portal/__init__.py` の1行です。
```diff
-            count=sum(storage.status_counts(database_path).values()),
+            count=len(records),
```

**実行結果:**
| コマンド | 終了コード | 要約 |
| --- | --- | --- |
| `uv run --locked pytest --ignore=tests/test_reference_patch.py -q` | 0 | 134件成功 |
| `uv run --locked ruff check .` | 0 | 指摘なし |
| `uv run --locked ruff format --check .` | 0 | 19ファイル整形済み |
| `uv run --locked mypy` | 0 | 5ファイルで問題なし |

**テストの根拠:**
- `count` が一覧の実数と一致することは `tests\test_filtering.py:28` で確かめています。単独・複合・空文字・`scoutTheme` の条件に使われる確認です。
- 0件の場合は `test_filtering.py:87-94`、全体集計 `[12, 5, 4, 3]` が変わらないことは `test_filtering.py:79` で確かめています。
- 修正の内容から、修正前は複合・0件の検索で `count` が12になり、28行目などが失敗すると考えられます。ただし修正前には実行していないため、実際に失敗することは確かめていません。
- テストの追加・変更はしていません。

**未確認:**
- 講師用パッチを当てる `tests/test_reference_patch.py` は、指定どおり除外しました。
- 実ブラウザーでの確認は、デモDBに触れるため許可がなく、実施していません。
- 別のPython版での確認も実施していません。


### B
AC-08を満たすように修正しました。指定した品質確認4件は、いずれも終了コード0です。

**原因：** `request_portal\__init__.py` の `api_request_list` で、`count` に絞り込み後の一覧の件数ではなく、全申請の総数（`status_counts` の合計）を入れていました。画面の「N件を表示」は、もともと一覧の件数でした。

**差分（1行）：**
```diff
-            count=sum(storage.status_counts(database_path).values()),
+            count=len(records),
```
全申請の総数と状態別件数の処理は変えていません。

**対象版：** HEAD は ea036e3 です。作業前の `git status` に変更はなく、作業後は `M request_portal/__init__.py` だけです。差分は目視で確認し、ハッシュは照合していません。

**実行結果：**

| コマンド | 終了コード | 結果 |
| --- | --- | --- |
| `pytest --ignore=tests/test_reference_patch.py -q` | 0 | 134件成功（10.10秒） |
| `ruff check .` | 0 | All checks passed |
| `ruff format --check .` | 0 | 19ファイル整形済み |
| `mypy` | 0 | 5ファイルで指摘なし |

**テストの根拠（`tests\test_filtering.py`）：**
- 28行と33行：APIの `count` と項目数、画面の件数が一致すること。単独・複合・空文字・0件の条件で確かめます。
- 79行：絞り込み中も全体集計が [12, 5, 4, 3] のままであること。

既存テストで足りたため、テストは追加・変更していません。

**未確認：**
- 修正前にこのテストが失敗することは、実行して確かめていません。
- 実ブラウザーでの確認は、許可がないため実施していません。
- 講師用パッチを当てる確認は、依頼どおり除外しました。

