# 第7章 DRメモ（参加者・コミットしない）

## 受け取った版（第6章から）

- 作業コピー：ws\main。`git log -1 --oneline` → `a352d73 Start version (from fixed reference 1a411cd)`
- `git status`：追跡済み9ファイルに未コミットの変更。差分（`git diff --binary HEAD`）の git hash-object は `d981467bad5860da92f7b22172573e7fe73942a1`（第6章の記録と一致）
- 差分に含まれない未追跡のソース・設定（git hash-object）
  - tests/test_filtering.py：f8dded2f7b73cec31a57a5baafc52bf2d74143d9
  - .github/agents/portal-reviewer.agent.md：3273ddf6b5f5f043dbe777cb08c6243acddd4204
  - .github/instructions/tests.instructions.md：059d6ef13f2b99499135921038e79d25c215f4fa
  - .github/skills/verify-portal/SKILL.md：4f08b184f5a6aa19fac1f0c805c8eeb19cb3f9e0
- 品質の根拠（6-5）：この版で pytest（tests/test_reference_patch.py を除く）194 passed、ruff check・ruff format --check・mypy が成功。
- 注意：将来CIが取得するコミットは a352d73 で、上の未コミット変更と未追跡ファイルを含まない。定義を追加した後の版は、受け取った版とは別に記録する。
- 講師が置いた骨組み：infra/versions.tf（Terraform = 1.16.6、hashicorp/azurerm = 5.10.0）。
- 残課題（第6章から）：狭い幅とTabキーでの送信は未確認。400ページで配色が引き継がれない点は改善候補（不採用）。

## アプリの事実

| 項目 | 事実 | 根拠 |
| --- | --- | --- |
| 起動 | `python -m request_portal serve --port <番号>`。Werkzeugの開発用サーバーで、127.0.0.1だけで待ち受ける | request_portal/__main__.py L54、L75 |
| 依存 | 実行時の直接依存はFlaskだけ（>=3.1,<4）。uv.lockで固定。requires-python は >=3.13,<3.15、.python-version は 3.14 | pyproject.toml、uv.lock、.python-version |
| 設定 | SECRET_KEYは起動ごとに乱数で作る。DATABASEはPath型が必須で、既定は instance/portal-demo.sqlite3。SEED_DEMO_DATA=True。TRUSTED_HOSTSは127.0.0.1とlocalhost（Codespacesでは転送先のHostを追加） | request_portal/__init__.py L96〜L112、storage.py L10、__main__.py L25〜L43 |
| 環境変数 | アプリが読む環境変数はCodespaces関連だけ。それ以外の名前をTerraformに書いても読まれない | __main__.py L26〜L29 |
| DB | SQLiteのファイル。初回起動で架空データ12件を作る。reset-demoは固定パスとマーカーを確認する | README、storage.py L10 |
| 認証 | なし。誰でも状態を変更できる。外部公開しない前提 | README「本番システムとの境界」 |
| 品質確認 | `uv run --locked pytest --ignore=tests/test_reference_patch.py -q`、`uv run --locked ruff check .`、`uv run --locked ruff format --check .`、`uv run --locked mypy` | README「テストと静的確認」 |
| OS・シェル | ホストはWindows（PowerShell）、Dev ContainerはLinux（bash）の手順がある | README |

## DRごとの整理

| DR | アプリから分かること | 人が判断すること | 実環境で確かめること | 対応方針・確認方法 | 判断する人 |
| --- | --- | --- | --- | --- | --- |
| DR-01 同じ版を追跡 | 品質確認はHEAD＋未コミット差分＋未追跡4件で行った | 品質確認済みの変更と定義を、どのコミットにまとめるか | CIが取得するコミット | 受け取った版と定義追加後の版を別に記録する。CIと成果物に取得したコミットIDを残す | アプリ責任者 |
| DR-02 合意した仮想構成に限定 | 127.0.0.1専用の開発用サーバー、認証なし | App Service（Linux）の単一アプリ案を採るか。公開範囲 | 使えるランタイム、起動方法、ネットワーク制限 | 資源はリソースグループ・App Service Plan・Linux Web Appに限る。DB置換・認証追加・本番機能は加えない | アーキテクト、セキュリティ担当 |
| DR-03 実行・依存・確認の条件 | Python 3.14が既定、3.13も対象。uv.lockで固定 | CIのOS・シェル・Python・uvの版 | エージェントにPython 3.14とuvを用意できるか。App ServiceのPython版 | CIで `uv sync --locked`。Python・uvの版、OS・シェルを明記する | 開発チーム、CI管理者 |
| DR-04 データと秘密を持ち出さない | instance/（DB）は.gitignore済み。SECRET_KEYはコード内で生成し、資格情報は不要 | 秘密を置く場所（今回は範囲外） | なし | DB・.env・state・.venv・キャッシュを成果物とリポジトリから除く。秘密を既定値に書かない | セキュリティ担当 |
| DR-05 Terraformの入出力 | アプリは任意の環境変数を読まない | 入力の実値（名前、リージョン、SKU）と指定元 | 名前の重複、権限 | 入力には型と説明を付け、実値を既定値にしない。出力の利用側を示す | インフラ担当 |
| DR-06 品質確認を省かない | 上の4コマンド。194件 | CIで必須にする確認。ブラウザー確認の扱い | CI上での実行 | 4コマンドを必須にする。Terraformのfmt・validateを入れるか決める | 品質責任者 |
| DR-07 不足を成功扱いにしない | なし | 失敗・中断・スキップ時の扱い | 条件式の実際の動作 | 先行段階の成功と、必須テストの実行件数で判定する | 品質責任者 |
| DR-08 確認した入力から成果物 | ソースは request_portal/、依存定義は pyproject.toml・uv.lock | 含めるもの、名前、版の記録 | 成果物の保存と取得 | 含めるファイルを限定して梱包し、版とdigestを記録する | アプリ責任者 |
| DR-09 CDは定義案だけ | なし | 配備の承認者、接続 | サービス接続、環境の承認 | 通常のCIから参照しない別の定義にし、登録・接続・実行をしない | 運用責任者 |
| DR-10 未設定・未検証と判断者 | なし | 次に判断する人 | 下の「未確認のこと」全般 | 引き継ぎで、未設定（接続・承認・stateの保存先・実値）と未検証（適合・動作）を分ける | 参加者→各責任者 |
| DR-11 環境ごとの資源・設定・state | アプリは任意の環境変数を読まない | 論理環境、命名、設定元、stateの分離と権限 | 環境ごとの実値・対象・backendの分離 | 環境名を資源名の接頭辞とタグに使い、設定とstateは環境別の対応表で区別する。backendは未設定 | インフラ担当、セキュリティ担当 |
| DR-12 環境をまたぐ同一成果物 | アプリと依存定義は同一ZIPに梱包する案 | 承認済みのCI実行・成果物・digest、保存先と取得権限 | 特定実行からの取得、各環境での内容・digest照合 | 環境ごとに再ビルドせず、同じ実行・成果物・コミット・digestを指定する。取得と配備は未実装 | アプリ責任者、運用責任者 |
| DR-13 CIを始めるきっかけと対象 | ソース連携の情報はアプリにない | 連携先（GitHubかAzure Repos）、push・PR・手動、ブランチとパス | サービス側の設定（PRの扱いなど） | YAMLに書けるトリガーと、サービス側の設定を分けて記録する | リポジトリ管理者、CI管理者 |

## App Service（Linux）案で未確認のこと

- Python 3.14を選べるか。3.13で動かすなら、3.13での確認結果が要る（第6章の確認は3.14の .venv）。
- 起動：アプリは127.0.0.1で待ち受けるため、App Serviceのフロントから届かない可能性が高い。Host検証（TRUSTED_HOSTS）も配備先の名前を許可しない。今回はアプリを変えず、適合不足として返す。
- SQLiteの保持：instance/ はアプリのフォルダー内にあり、配備のたびに置き換わるおそれがある。保存先、バックアップ、複数インスタンスでの共有は未決。
- 公開条件：認証がなく、外部公開しない前提。非公開にできる構成かは未決。
- SECRET_KEYが起動ごとに変わるため、複数のワーカーや再起動でフォームのトークンが無効になる。

## 7-1「結果を確かめる」

- コードだけでは決まらないもの：サービスの採否、リージョン・SKU・名前、Azureの契約（subscription）、ソース連携とサービス接続、stateの保存先と権限、承認者、公開範囲。
- ACとDRを混ぜない：AC-01〜AC-11はアプリの機能。DRは配備・自動化の要件で、ACを変えない。
- 架空の実値を書かない：subscription ID、接続名、承認者名は未決のまま残す。
