# 第8章 A/B 比較条件（実行前に記録）

- 問い：関連ファイルを最初に明示すると、同じ品質に到達するまでの探索や手戻りはどう変わるか。
- 開始版：b415815（検索結果は正しいが API の count が全件数）。A・B は追跡ファイルのインデックスのハッシュが同じ（436bd5bc…）。
- 両方に同じものを置いた：本編で採用した AGENTS.md（D8079F5F…）、tests.instructions.md、verify-portal Skill、Portal Reviewer、ac-memo.md。
- 開始時の想定どおりの失敗：品質確認を A のコピーで実行し 23 failed / 111 passed（すべて test_filtering の件数の確認）。書き込みなしで実行し、状態は変わらないことを確認。
- 実行環境：VS Code Stable（実行ルート専用のユーザーデータ）、Local、Default permissions、Agent、GPT-6.1 Terra（Medium）。別ウィンドウ・新しい会話。順序は A → B。
- 記録する指標：結果、品質確認の最終結果（各条件の最終コードに対応）、credits（会話ログの値）、所要時間（会話ログの elapsed）、ツール呼び出し（読んだファイル・検索・コマンド）、人の許可の回数、人の追加説明・ヒント（予定は0回）。
- 止める条件：対象版が違う、品質確認に不備、解法の混入、許可範囲外、必須情報を確認できない。

## 共通の依頼（A・B 同文）

この作業フォルダーは第8章の比較教材です（HEAD b415815）。指定した比較教材で、検索結果とAPIのcountが一致しない問題を調べ、AC-08を満たすように修正してください。AC は ac-memo.md にあります。検索結果の正しさ、単独・複合・0件、全体集計、UI/APIと既存操作を維持してください。必要な調査は許可します。無関係な機能や依存を追加せず、確認を削除・弱体化しないでください。両条件で決めた共通の品質確認を実行し、対象版・差分・実行結果・未確認を報告してください。共通の品質確認：uv run --locked --offline pytest tests/test_filtering.py -q、uv run --locked --offline pytest tests/test_portal.py -q、uv run --locked --offline pytest --ignore=tests/test_reference_patch.py -q（講師用の完成例パッチの検品は、コードを変えたコピーでは必ず失敗するため除外）、uv run --locked --offline ruff check .、uv run --locked --offline ruff format --check .、uv run --locked --offline mypy。開始時点では、共通の品質確認の一部が開始版の不具合を検出して失敗します（想定どおりの失敗）。

## B にだけ加える1行

関連ファイル：request_portal/__init__.py、request_portal/storage.py、tests/test_filtering.py
## 結果（8-3 の表）

| 記録項目 | A | B |
| --- | --- | --- |
| 開始版・データ・条件 | b415815、同じ指示・Skill・AC、Agent、GPT-6.1 Terra Medium、新しい会話 | 同じ。依頼の末尾に「関連ファイル：…」の1行だけを追加 |
| 結果 | 成功 | 成功 |
| 途中の失敗と回復 | 修正前に `pytest tests/test_filtering.py -q --maxfail=1` で狙った失敗（assert 12 == 1）を再現してから修正。再試行なし | 修正前の失敗の再現はしなかった（コードを読んで原因を判断し、すぐ修正）。再試行なし |
| 共通の品質確認の根拠 | 絞り込み50・portal47・全体134、ruff・format・mypy 成功。私が独立に再実行して134件・ruff・format 成功 | 同じ（50・47・134、静的確認すべて成功）。独立再実行も同じ |
| 最終コード | `__init__.py` の1行（count=len(records)） | A とバイト単位で同じ |
| 利用量（会話ログの credits） | 6.25 | 5.43 |
| 時間（会話ログの elapsed、人の許可待ちを含む） | 495秒（画面表示「2m 53s」は作業時間の表示で範囲が違う） | 430秒 |
| 読んだファイル・検索 | ac-memo、test_filtering、SKILL、grep、__init__、storage、list.html、README（8回） | ac-memo、SKILL、test_filtering、grep、__init__、list.html、storage、README、tests.instructions（9回） |
| 人の介入 | 許可10回。追加説明・ヒント0回 | 許可8回。追加説明・ヒント0回 |
| 揃わなかった条件・未確認 | 実行順（A が先）。人の許可の速さは条件ごとに異なる | B の1回目は依頼文中の改行で送信が分かれ、関連ファイルの行なしで始まったため、読み取りのみの段階で中止（予備試行、変更なし、コピーの状態は開始時と同じを確認）。新しい会話でやり直した |

## 読み方（8-4 の順）
- 条件：一つの違い（関連ファイルの1行）以外はそろった。B の予備試行は本試行に含めない。
- 品質：両方とも共通の品質確認をすべて満たした。最終コードも同じ。
- 負担：B は credits が約13%少なく、許可が2回少なかった。ただし、差の大部分は A が修正前に失敗を再現したこと（許可2回分）で説明できる可能性がある。B は関連ファイルを示されても test_filtering.py を読み、grep もした。示したファイルを使ったかは読取の記録で確認できるが、探索の範囲はほぼ同じ。
- 解釈：1組の結果で、関連ファイルの明示が探索を減らしたとは言えない。B が失敗の再現を省いたことは、品質を下げなかったが、手順として望ましいとは限らない。
- 判断：追加評価（同じ順序の影響を除くため、順序を入れ替えた組を行う。失敗の再現を両方に求めるかを先に決める）。
