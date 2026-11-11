# 第8章 A/Bの条件の記録（試走担当が用意。実行前に記録）

| 項目 | A | B |
| --- | --- | --- |
| 比較教材の開始版 | ea036e3（tree 115491e8…） | ea036e3（tree 115491e8…）。Aとは別の独立コピー |
| 開始時の品質確認（校正） | pytest 23 failed / 111 passed、ruff・format・mypy 成功。ACごとの照合で62件中44件が欠陥を検出 | 同じ（同じ開始版） |
| データ | テストは一時DB。デモDB（instance）は無い | 同じ |
| モデル・推論 | claude-opus-5.5、medium | 同じ |
| CLI・会話 | Copilot CLI 1.0.98、新しい会話（専用プロファイル ch8-a） | 同じ版、別の新しい会話（専用プロファイル ch8-b） |
| 実効ツール・許可 | view・glob・grep・edit・create・powershell。書き込み、uv・git（破壊的な操作は拒否）など、第5章の実装担当と同じ | 同じ |
| 指示・Agent・Skill | 開始版に含まれる AGENTS.md、tests.instructions.md、portal-reviewer、verify-portal（同じファイル） | 同じ |
| 依頼文 | 共通の依頼（handovers/ch8-request-A.txt） | 共通の依頼＋「関連ファイル：request_portal/__init__.py、request_portal/storage.py、tests/test_filtering.py」の1行だけ |
| 実行順 | 1番目 | 2番目（Aの会話・コードは引き継がない） |
| 停止条件 | 対象版が違う、品質確認に不備、解法の混入、許可範囲外、必須情報の欠落 | 同じ |
| 記録する指標 | 結果、途中の失敗と回復、共通の品質確認の結果、AIクレジット・トークン（CLIの使用量出力。入力・出力・キャッシュ読み書きの内訳）、所要時間（CLIの起動から終了まで）、ツール呼び出しの回数と失敗、関連ファイルを実際に読んだか | 同じ |
| 揃わない可能性がある条件 | 実行順（Bは2番目）、サービス側のキャッシュ、試走担当がAの結果を見てからBを実行すること | 同じ |

## 共通の依頼（A）

この作業コピーは、第8章の比較教材（申請ポータル。部署・状態の絞り込みを実装済み）です。対象版は ea036e3 です。ACの写しは .rehearsal/ac.md にあります。
AC-08：一覧を絞り込んだとき、APIのcountと画面の結果件数は一覧の実数にする。全申請の総数・状態別集計は、絞り込みで変えない。

指定した比較教材で、検索結果とAPIのcountが一致しない問題を調べ、AC-08を満たすように修正してください。
検索結果の正しさ、単独・複合・0件、全体集計、UI/APIと既存操作を維持してください。
必要な調査は許可します。無関係な機能や依存を追加せず、確認を削除・弱体化しないでください。
両条件で決めた共通の品質確認を実行し、対象版・差分・実行結果・未確認を報告してください。

共通の品質確認：uv run --locked pytest --ignore=tests/test_reference_patch.py -q、uv run --locked ruff check .、uv run --locked ruff format --check .、uv run --locked mypy（講師用パッチを当てる確認2件は除外します）。手順は AGENTS.md の確認コマンドと verify-portal Skill に従ってください。
コマンドは、他のコマンドと組み合わせず単独で実行してください。コミットはしません。

## Bにだけ加える1行

関連ファイル：request_portal/__init__.py、request_portal/storage.py、tests/test_filtering.py
