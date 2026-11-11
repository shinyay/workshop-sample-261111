# レビュー用メモ（5-5）

対象版と差分：
- 作業コピー：本編 main（`git log -1 --oneline` は `a352d73 Start version (from fixed reference 1a411cd)`）。絞り込みの実装はすべて未コミットの変更です。
- 変更ファイル（`git diff --stat`）：AGENTS.md、README.md、request_portal/__init__.py、request_portal/static/portal.css、request_portal/storage.py、request_portal/templates/base.html、request_portal/templates/list.html、tests/conftest.py、tests/test_portal.py（9ファイル、+114/−21）。
- 新規ファイル：tests/test_filtering.py、.github/（tests.instructions.md、agents/portal-reviewer.agent.md、skills/verify-portal/SKILL.md）。
- コミットしないメモ：ac-memo.md、plan-memo.md、ch3-memo.md、unit1〜3-handoff.md、unit2-end.diff、このメモ。

AC → 変更箇所 → 確認方法 → 結果：
- AC-01〜AC-04：storage.py の一覧取得（部署・状態の条件をプレースホルダーで追加）と __init__.py の条件解釈 → test_filtering.py と、起動中サーバーへの25条件の照合（条件なし、部署4、状態3、AND12、空文字5） → すべて成功。画面のフォーム送信で `department=&status=approved` が送られ、空の部署は未指定として承認済み4件を表示。
- AC-05：0件の画面と空の items → 照合で `corporate`＋`rejected` が唯一の0件。APIは `items: []`、`count: 0`。画面は「条件に一致する申請はありません」、説明、解除リンクを表示 → 成功。
- AC-06：不正値、空白、大文字、重複キー、未対応キーの9条件 → 画面・APIとも400。APIは `error.code` 400 と説明、画面は `role="alert"` の説明 → 成功。
- AC-07：画面とAPIで同じ取得処理 → 25条件すべてで、画面とAPIの申請IDの並びが一致 → 成功。
- AC-08：画面の「N件を表示」、APIの count、一覧の行数が一致。全体集計（12件：確認待ち5、承認済み4、差し戻し3）は絞り込みで変わらない → 成功。
- AC-09：選択状態の表示と解除 → 送信後に選択値がプルダウンに残り、「条件を解除」で条件なしの一覧へ戻る → 成功。
- AC-10：配色の維持と既存操作 → 既定と異なる light と既定の dark の両方で、フォーム送信と解除の後も scoutTheme が保たれた。新規作成、承認、処理済み申請の変更不可も画面で確認 → 成功。
- AC-11：storage.py は `WHERE department = ?`、`status = ?` とパラメーターを使い、文字列連結していない。依存の追加なし、ループバックのみで起動 → 差分で確認。

画面/APIの確認と使用データ：
- 起動：`uv run --locked python -m request_portal serve --port 8765`。初回起動で instance\portal-demo.sqlite3 に初期12件が作られた。
- ブラウザー：Edge（専用プロファイル）。OS の既定は dark のため、既定と異なる light から確認し、dark も確認した。
- 照合の記録：evidence\ch5-5-http-before.json、evidence\ch5-5-http-after-reset.json（同じ結果）。

既存機能の回帰：
- `uv run --locked pytest --ignore=tests/test_reference_patch.py -q`：194 passed。ruff check、ruff format --check、mypy も成功。
- 画面で新規作成（#013）と承認を行い、件数は12件（5/4/3）から13件（5/5/3）になった。処理済みの申請では承認・差し戻しのボタンが消え、変更できないと表示された。
- サーバーを停止して `reset-demo --confirm request-portal-demo` を実行し、12件（5/4/3、ID 1〜12）へ戻ったことを確認した。

計画から変えたことと人の判断：
- 変更単位1で、表示段階を exercise に変え、README を演習版の説明に更新した。検証で「依頼外の変更」と指摘されたが、採用した。
- 変更単位1の __init__.py のエラー説明の変更も、検証の指摘を受けたうえで採用した。
- 変更単位3で Copilot が始めようとした一時DBの確認用サーバーは、依頼外のためスキップした。画面確認はこの節で人が行った。

失敗・未実施・未確認：
- キーボードだけの操作は一部のみ。プルダウンの値を矢印キーと Enter で選べること、表のスクロール領域にフォーカス枠が出ることは確認した。Tab でボタンへ移動して送信する流れは、操作の都合で最後まで確認できていない。
- 狭い画面幅での表示は未確認。
- 400 画面の「申請一覧へ戻る」とヘッダーのリンクは scoutTheme を引き継がない。開始版からの既存の挙動で、AC-10 が対象とするフォーム送信と解除の範囲外と判断したが、レビューで扱いを確認したい。
- tools/verify_browser.py は、教材の指示どおり合否の基準に使っていない。

支援／講師記録の読解／提供部分：
- 5-4 の診断テストは講師の検証例を使い、デバッグ用コピーで自分で再現・修正・再実行した。本編へは持ち込んでいない。
- 講師用パッチの確認テスト（tests/test_reference_patch.py）は回帰の対象から除いた。
- 照合には、ドライラン用に用意した照合スクリプト（教材の外の補助）を使った。

次のレビューで確認してほしいこと：
- 検索キーの重複や空白を含む値の判定が、ACの補足どおりか（画面とAPIで同じ扱いか）。
- README の演習版の説明と、画面の段階表示の文言が一致しているか。
- 400 画面から戻るときの配色の扱い（上記の未確認事項）。
