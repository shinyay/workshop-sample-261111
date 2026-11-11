# 第8章 A/B 比較条件（実行前に記録）

- 問い：関連ファイルを最初に明示すると、同じ品質に到達するまでの探索や手戻りはどう変わるか。
- 予想：B は最初から request_portal/__init__.py を読み、検索や読むファイルが減るかもしれない。ただし、AGENTS.md・Skill・ac-memo で道案内が足りていれば、差は出ない可能性もある。
- 確かめる記録：読んだファイルと検索の順序・回数、コマンド、credits、時間、許可の回数、最終差分、共通の品質確認の結果。

## 揃えた条件

- 開始版：b415815（検索結果は正しいが、API の count が全申請件数になる）。A・B は追跡ファイルのインデックスのハッシュが同じ（436bd5bc…）。どちらも開始時は未変更。
- 両方に同じものを置いた（本編で採用したもの。SHA-256 の先頭12桁）：AGENTS.md（7E6C85DDE46D）、.github/instructions/tests.instructions.md（5FA4B155D073）、.github/skills/verify-portal/SKILL.md（77A66081F37E）、.github/agents/portal-reviewer.agent.md（F7650862AB35）、ac-memo.md（B41014A80759）。b415815 の AGENTS.md は本編の開始版 a352d73 と同じなので、違いは本編で採用した追記だけ。
- 開始時の想定どおりの失敗（講師役として ch8-A で事前に確認。キャッシュも書き込まない設定）：tests/test_filtering.py は 23 failed／27 passed、tests/test_portal.py は 47 passed、全体（講師用パッチの検品を除外）は 23 failed／111 passed。ruff check・ruff format --check・mypy は成功。実行後もコピーの状態は変わらない。
- 実行環境：VS Code 1.145.2（実行ルート専用のユーザーデータ）、Local、Default permissions、Agent、GPT-6.1 Terra（Max、872K）。条件ごとに別ウィンドウ・新しい会話。順序は A → B。
- 記録する指標：結果、共通の品質確認の最終結果（各条件の最終コードに対応）、credits（会話の保存データにある依頼ごとの最終値）、時間（会話の保存データの elapsed。人の許可待ちを含む。画面の作業時間は範囲が違うので使わない）、ツール呼び出し（読んだファイル・検索・コマンド）、人の許可の回数、人の追加説明・ヒント（予定は0回）。
- 止める条件：対象版が違う、品質確認に不備、解法の混入、許可範囲外、必須の情報を確認できない。開始版の不具合を検出する失敗は不備ではない。
- 許可の方針：コピーの中での読み取り・検索・共通の品質確認・その他の確認コマンドは許可する。依存の取得・追加、ネットワーク、コミット、コピーの外への書き込みは許可しない。
- 送り方：入力欄では Enter で送信されるので、依頼は1行で送る。B は共通の依頼の末尾に、同じ行で関連ファイルの1行を続ける。

## 共通の依頼（A・B 同文、notes\ch8-A-prompt.txt）

この作業フォルダーは第8章の比較教材です（HEAD b415815）。指定した比較教材で、検索結果とAPIのcountが一致しない問題を調べ、AC-08を満たすように修正してください。ACは ac-memo.md にあります。検索結果の正しさ、単独・複合・0件、全体集計、UI/APIと既存操作を維持してください。必要な調査は許可します。無関係な機能や依存を追加せず、確認を削除・弱体化しないでください。両条件で決めた共通の品質確認を実行し、対象版・差分・実行結果・未確認を報告してください。共通の品質確認：uv run --locked --offline pytest tests/test_filtering.py -q、uv run --locked --offline pytest tests/test_portal.py -q、uv run --locked --offline pytest --ignore=tests/test_reference_patch.py -q（講師用の完成例パッチの検品は、コードを変えたコピーでは必ず失敗するため除外）、uv run --locked --offline ruff check .、uv run --locked --offline ruff format --check .、uv run --locked --offline mypy。開始時点では、共通の品質確認の一部が開始版の不具合を検出して失敗します（想定どおりの失敗）。

## B にだけ加える（同じ行の末尾、notes\ch8-B-prompt.txt）

関連ファイル：request_portal/__init__.py、request_portal/storage.py、tests/test_filtering.py

3つとも b415815 にあることを確認した。修正方法や完成差分は含めない。
