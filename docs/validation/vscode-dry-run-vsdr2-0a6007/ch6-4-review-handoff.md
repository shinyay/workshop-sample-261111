# 再レビュー依頼

## 対象と範囲

- 作業コピー: `［実行ルート］\ws\ch6-quality`
- HEAD: `874445ca2c3f6b1041fcfcc6045a240fc013132c`
- 対象: 一覧取得の部署・状態の結合をORからANDへ変更した箇所と、AC-04の新規テスト。
- 人が合意したアプリ修正は `request_portal/storage.py` の結合だけ。SQLのプレースホルダーは維持。
- `AGENTS.md` の変更と `.github/`・`review-input/` の未追跡ファイルは作業開始前から存在。維持条件は作業コピーの `AGENTS.md` を参照。
- 受け入れ条件、6件の架空データ、人の判断は、作業コピーの `review-input/ac04-and-data.md` と `review-input/adopted-finding.md` を参照。

## 版の照合

- 最終確認の直前・直後: `fixed-recheck-before.txt` / `fixed-recheck-after.txt` と、対応する `.patch`。HEAD、変更ファイル、未追跡ファイルの内容ハッシュは一致。
- 最終版の、HEADを起点とする追跡済みファイルの差分全文: `fixed-recheck-after.patch`。SHA-256: `b9529494380a71634204b077cf8903ed22fff75b2372b66f235492a9c4431d1b`。
- 上記の差分には既存の `AGENTS.md` の変更も含む。未追跡の追加テストはGitの差分に含まれない。
- 対象ソースの写し: `review-source-storage.py` と `review-source-test_ac04_filtering.py`。それぞれ作業コピーの内容と `git hash-object` が一致し、結果は `review-source-hashes.txt` に記録。
- ソースのGitオブジェクトハッシュ: storage `d68e613cd8ba87bb10e204dd92fc95f815f56b07`、追加テスト `8c2982681a2d30f70dfd0d8110798da025283b23`。
- 資料準備時の直前・直後の記録は `handoff-before.txt` / `handoff-after.txt` と対応する `.patch`。最終確認後の版と一致。
- 作業コピーを読む際は記録後の変更がないことを人が確認する。確認できない場合、写し・差分・記録を根拠に区別して扱う。

## 欠陥版と修正後の同一テスト

- 各テストは初期データを投入しない一時DBにF1〜F6を作成し、部署・状態・実IDと状態別件数（確認待ち3、承認済み2、差し戻し1）を照合。
- 欠陥版では収集24件成功、実行20成功・4失敗。画面とAPIの両方で、engineering＋pendingは期待F1の1件に対しF1・F2・F3・F5の4件、corporate＋pendingは期待0件に対しF1・F3・F4・F5の4件。画面の表示件数とAPIの `count` も実際は4。
- 欠陥版と修正直後の追加テストの `git hash-object` はともに `891a8f07154a5822dfe40d9b071210349d11fafc`。同一テストは修正後24件すべて成功。
- その後、追加テストの長い行と整形に対するruffの指摘を `ruff format` で修正。期待値は変更せず、最終版の同じ24ケースも成功。初回の指摘は `fixed-test-lint.log` と `fixed-test-format.log` に残している。
- 欠陥版の収集・実行記録は `defect-collection.log` / `defect-check.log`、修正直後は `fixed-collection.log` / `fixed-check.log`、整形後の最終確認は `fixed-recheck-collection.log` / `fixed-recheck-check.log`。

## 最終版の回帰確認

以下はすべて終了コード0。`UV_NO_SYNC=1` と `UV_OFFLINE=1` を設定し、依存の追加・更新や外部取得なしに実行。

| コマンド | 結果 | 記録 |
| --- | --- | --- |
| `uv run --locked pytest --ignore=tests/test_reference_patch.py -q` | 108成功 | `fixed-regression-pytest.log` |
| `uv run --locked ruff check .` | 成功 | `fixed-regression-ruff.log` |
| `uv run --locked ruff format --check .` | 21ファイル整形済み | `fixed-regression-format.log` |
| `uv run --locked mypy` | 5ソースファイルに問題なし | `fixed-regression-mypy.log` |

変更したソースと追加テストのエディタ診断もエラーなし。直前・直後の版は `editor-before.txt` / `editor-after.txt` と対応する `.patch` に記録した。

講師用パッチの配布物確認2件は指示どおり除外。実ブラウザー確認は任意のため未実施。既存の起動中アプリのDBは操作していない。

差分、維持条件、同じ版の実行結果を照合し、問題・影響・必要な追加確認・未確認事項を区別して再レビューしてください。
