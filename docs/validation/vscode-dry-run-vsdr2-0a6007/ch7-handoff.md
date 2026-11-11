# 第7章 引き継ぎメモ（参加者・コミットしない）

## 版

- 受け取った版：HEAD a352d73 ＋ 追跡済みの差分（hash d981467）＋ 未追跡4件（第6章の記録と一致）。品質の根拠は第6章 6-5（194 passed、ruff・format・mypy 成功）。
- 定義を追加した版：上の版に infra/ と pipelines/（19ファイル、records\ch7\defs-after-7-4.txt に git hash-object）を加えたもの。アプリのコードと差分の hash は変わっていない。
- どちらも未コミット。将来 CI が取得するのはコミットなので、今のままでは a352d73 だけが対象になり、品質確認した変更も定義も含まれない。どのコミットにまとめるかはアプリ責任者が決める。

## 横断レビューの指摘と判断（レビュー担当、読み取りのみ）

| 指摘 | 判断 | 理由 |
| --- | --- | --- |
| 高：追加した補助スクリプトで ruff check（7件）と ruff format --check（7ファイル）が失敗し、CI が梱包へ進めない | 採用。今回は直さず引き継ぐ | 私の実行で確認。修正範囲（補助スクリプトの整形・import 順）は合意していない |
| 高：起動方法・依存の準備・非公開の経路が未定義。127.0.0.1 での待ち受けと Host 制限のため、そのままでは配備先で受け付けられない見込み | 採用（既知の適合不足。実環境では未確認） | 7-1 の時点で記録済み。アプリは変えない |
| 中：git status が失敗すると出力が空になり、未変更の確認を通過する（ci.yml の Verify と Package） | 採用 | Git Bash で、リポジトリの外でも「check passed」で終了コード0になることを確認 |
| 中：補助スクリプトの unittest が0件・全スキップでも成功する | 一部採用 | Python 3.14 では0件は終了コード5で失敗。全スキップは終了コード0で通過する |
| 中：Terraform は Python 3.13 も選べるが、CI は 3.14 だけを確認する | 採用 | variables.tf の検証と ci.yml の UsePythonVersion を照合 |
| 中：ルートの .gitignore に .env と state がない | 採用（低めの中） | infra/.gitignore は infra/ の中だけが対象。梱包は許可リストなので ZIP には入らないが、ルートに置いたファイルがコミットに入るおそれは残る |
| 中：成果物の照合が全モジュール・テンプレートの存在と ZIP からの起動を確かめない | 採用 | 照合は改ざんの検出が目的で、起動の保証ではない |
| 低：README の「未実施」がどの時点の記述か曖昧 | 採用 | 引き継ぎでは時点を明記する |

## DR ごとの引き継ぎ

```text
DR-ID：DR-01 同じ版を追跡する
対応する定義・箇所：pipelines/ci.yml（HEAD・Build.SourceVersion・承認済み件数の版を照合）、package_artifact.py（SOURCE_REVISION と metadata）
アプリ／Terraform／パイプラインの受け渡し：CI のコミット → ZIP 内の SOURCE_REVISION と metadata → CD の承認値。Terraform は版を扱わない
確認の種類と実際の結果：許可されたローカル確認（私が実行）。TEMP で梱包と照合を動かし、一致は通過、選んだ実行 ID の違い・一式の差し替え・改ざんは拒否（DR-12）
未設定・未検証：品質確認した変更と定義が未コミット。git status 失敗時に通過する穴
次に判断する人と確認すること：アプリ責任者がコミットの単位を決め、そのコミットで品質確認をやり直す

DR-ID：DR-02 合意した仮想構成に限定する
対応する定義・箇所：infra/main.tf（リソースグループ、Linux の App Service Plan、Linux Web App。公開ネットワークは無効）
アプリ／Terraform／パイプラインの受け渡し：Terraform の出力 web_app_name などを CD の対象照合に使う案（未接続）
確認の種類と実際の結果：要件と定義の照合。validate 成功（値は未設定のまま）
未設定・未検証：非公開の経路、起動コマンド、127.0.0.1・Host 制限への対応。構成の採否
次に判断する人と確認すること：アーキテクトとセキュリティ担当が採否と公開範囲を決める。アプリの変更が要るなら別の合意にする

DR-ID：DR-03 実行・依存・確認の条件を揃える
対応する定義・箇所：ci.yml（ubuntu-latest、bash、Python 3.14、uv 0.13.0 の有無を確認、uv sync --locked）、variables.tf（python_version 3.13／3.14）
アプリ／Terraform／パイプラインの受け渡し：Python の版が Terraform と CI でずれている（3.13 を選ぶと未確認の版で動く）
確認の種類と実際の結果：要件と定義の照合。ローカルでは Windows の .venv（3.14.7）だけで確認
未設定・未検証：エージェント上の Python・uv の有無、Linux での terraform init（Terraform のロックファイルには windows_amd64 のハッシュしかない）
次に判断する人と確認すること：開発チームと CI 管理者が版を一本化し、Linux で init とロックを作り直す

DR-ID：DR-04 データと秘密情報を持ち出さない
対応する定義・箇所：package_artifact.py の許可リスト、infra/.gitignore
アプリ／Terraform／パイプラインの受け渡し：ZIP にはアプリの14ファイルと SOURCE_REVISION だけ
確認の種類と実際の結果：許可されたローカル確認（私が実行）。追跡ファイルの一覧にダミーの禁止ファイル9件を混ぜても、ZIP にはアプリの14ファイルと SOURCE_REVISION だけが入った
未設定・未検証：ルートの .gitignore に .env・state がない。許可されたソース内に秘密がないことは保証しない
次に判断する人と確認すること：セキュリティ担当が除外設定と秘密の保管先を決める

DR-ID：DR-05 Terraform の入出力を説明する
対応する定義・箇所：variables.tf（入力7つ。すべて必須で既定値なし。5つに値の検証）、outputs.tf（出力6つ）、infra/README.md の表
アプリ／Terraform／パイプラインの受け渡し：出力は将来の CD の対象照合に使う案。アプリは Terraform の値を読まない
確認の種類と実際の結果：validate 成功。変数の値は検査されない（リテラルにすると 3.15 などは拒否されることを確認）
未設定・未検証：実値と指定元、CD への受け渡し方法
次に判断する人と確認すること：インフラ担当が実値・命名・受け渡しを決める

DR-ID：DR-06 必要な品質確認を省かない
対応する定義・箇所：ci.yml の Verify（pytest と件数の判定、ruff、format、mypy、入力が変わっていないかの再確認）
アプリ／Terraform／パイプラインの受け渡し：Verify が成功したときだけ Package へ進む
確認の種類と実際の結果：許可されたローカル確認（私が実行）。実際の JUnit（194件）で、期待件数194なら成功、193件・pytest の終了コード1・期待件数0なら失敗。リポジトリ全体の ruff check（7件）と ruff format --check（7ファイル）は失敗
未設定・未検証：補助スクリプトの ruff・format 違反。Terraform とブラウザー確認を CI に入れるか
次に判断する人と確認すること：品質責任者が補助スクリプトの修正と CI の範囲を決める

DR-ID：DR-07 不足する確認を成功扱いにしない
対応する定義・箇所：check_junit.py、run_pytest.sh、ci.yml の condition（Verify が Succeeded のときだけ）
アプリ／Terraform／パイプラインの受け渡し：pytest の終了コード・件数・JUnit の集計をそろえて判定
確認の種類と実際の結果：許可されたローカル確認。Copilot が架空の JUnit 11通りと Git Bash の7通りを実行し、成功と報告した（私は再実行していない）。私は実際の JUnit の判定（DR-06）と、git status の失敗時の通過を Git Bash で再現した
未設定・未検証：git status 失敗時の通過、補助スクリプトの全スキップ時の通過、Azure Pipelines 上の条件式の動作
次に判断する人と確認すること：CI 管理者が判定の穴をふさぎ、サービス上で条件式を確かめる

DR-ID：DR-08 確認した入力から成果物を作る
対応する定義・箇所：ci.yml の Package（別の checkout で版を再確認、git ls-files から許可リストで梱包、SHA-256 と metadata）
アプリ／Terraform／パイプラインの受け渡し：成果物名 request-portal → CD の承認値
確認の種類と実際の結果：許可されたローカル確認（私が実行）。TEMP の確認用コピーで梱包し、内容を検査した（DR-04・DR-12）
未設定・未検証：ZIP からの起動。照合で必須とするのはルートの3ファイル、__init__.py、__main__.py、テンプレートと CSS 各1つ以上だけで、全モジュールがそろうかは確かめない。成果物の保存期間と権限
次に判断する人と確認すること：アプリ責任者と運用責任者が、成果物から起動できるかを確かめる手順を決める

DR-ID：DR-09 CD は実行せず、定義案だけを作る
対応する定義・箇所：pipelines/cd.yml（trigger・pr は none、パラメーターは UNSET、停止するジョブだけ）。ci.yml は cd.yml を参照しない
アプリ／Terraform／パイプラインの受け渡し：なし（未接続）
確認の種類と実際の結果：YAML の解析だけ。登録・接続・実行はしていない
未設定・未検証：取得と配備のタスク、サービス接続、環境の承認
次に判断する人と確認すること：運用責任者が配備の方式と承認者を決める

DR-ID：DR-10 未設定・未検証と判断者を残す
対応する定義・箇所：infra/README.md、pipelines/README.md、このメモ
アプリ／Terraform／パイプラインの受け渡し：—
確認の種類と実際の結果：要件と定義の照合
未設定・未検証：README の記述の時点が曖昧（7-2 と 7-4 で状況が変わった）
次に判断する人と確認すること：次の担当が、このメモの日時と版を基準に読む

DR-ID：DR-11 環境ごとに資源と設定・state を区別する
対応する定義・箇所：variables.tf の environment と名前の接頭辞の検証、タグ、outputs.tf の environment、infra/README.md の分離方針
アプリ／Terraform／パイプラインの受け渡し：verify_artifact.py の --environment は Terraform と同じ書式を要求する。CD の targetEnvironment は UNSET で、Terraform の値と結ぶ仕組みは未定義
確認の種類と実際の結果：validate 成功。state は作成・移動していない
未設定・未検証：backend と環境ごとの保存先・キー・権限、環境と対象の対応表
次に判断する人と確認すること：インフラ担当とセキュリティ担当が backend と権限を決める

DR-ID：DR-12 環境が変わっても同じ成果物を使う
対応する定義・箇所：package_artifact.py の metadata、verify_artifact.py、cd.yml の承認値のパラメーター
アプリ／Terraform／パイプラインの受け渡し：取得する側が CD のパラメーター（CI の組織・プロジェクト・パイプライン・実行 ID、成果物名、ソース版、SHA-256。すべて UNSET）で選び、verify_artifact.py が metadata・チェックサム・ZIP と照合する案
確認の種類と実際の結果：許可されたローカル確認で、同じ ZIP が dev と stg の両方で同じ digest のまま通り、選んだ実行の違い・一式の差し替え・改ざんは拒否
未設定・未検証：実際の取得タスクと取得元の確認、承認値の保管
次に判断する人と確認すること：運用責任者が承認値の記録と取得の方法を決める

DR-ID：DR-13 CI を始めるきっかけと対象を示す
対応する定義・箇所：ci.yml の trigger: none・pr: none（手動の暫定案）、pipelines/README.md
アプリ／Terraform／パイプラインの受け渡し：—
確認の種類と実際の結果：要件と定義の照合
未設定・未検証：ソース連携先、push・PR・手動の使い分け、ブランチ・パス、ブランチポリシーなどサービス側の設定
次に判断する人と確認すること：リポジトリ管理者と CI 管理者が決め、YAML とサービス側の両方を確かめる
```

## 確認の段階

| 確認の段階 | 言えること | まだ言えないこと |
| --- | --- | --- |
| 要件と定義の照合 | DR-01〜DR-13 に対応する記述がある。抜けと矛盾は上の指摘のとおり | 実際に正しく動作する |
| 参照仕様の確認 | AzureRM 5.10.0 のスキーマで validate が通る。python_version の候補は 3.7〜3.14 | Azure Pipelines の条件式・タスクの仕様、App Service の Python の提供状況 |
| 許可されたローカル確認 | 私が実行した Terraform の fmt・init -backend=false・validate、YAML の解析、補助スクリプトの unittest 35件、実際の JUnit の判定、梱包、dev／stg の照合は成功。リポジトリ全体の ruff check と ruff format --check は失敗 | plan・apply・配備の成功。Linux での init。ZIP からの起動 |
| 実環境の確認 | 今回は未実施 | クラウドとパイプラインでの成功 |
