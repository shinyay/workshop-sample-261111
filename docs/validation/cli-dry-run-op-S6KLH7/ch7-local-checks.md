# 7-2・7-3 ローカル確認の記録（試走担当が実行。対象は 514fc97 でコミットした内容と同じファイル）

| 確認 | 実際の結果 |
| --- | --- |
| terraform fmt -check -recursive（Terraform 1.16.6、WSL） | 成功（exit 0） |
| terraform init -backend=false（AzureRM 5.10.0を取得。stateの保存先には接続しない） | 成功（exit 0）。確認用の別フォルダーで実行し、作業コピーには .terraform も lock ファイルも作っていない |
| terraform validate | 成功（exit 0）。最初は確認用フォルダーに infra だけを複製したため ../.python-version が無く失敗（運用者の手順の誤り）。リポジトリと同じ配置で再実行して成功 |
| YAML の解析（yaml 2.9.1、重複キーの検査あり） | ci.yml・cd-draft.yml とも errors=0。ci.yml の job は quality・terraform・artifact（artifact は両方に dependsOn、condition: succeeded()）。cd-draft.yml は trigger: none、pr: none |
| 梱包スクリプト（ダミーの禁止ファイルを置いた確認用コピー） | ZIP は18件。request_portal/ に置いた .env.local・secrets.json・notes.db が ZIP に入った。.env・__pycache__/*.pyc・*.tfstate・instance/*.sqlite3 は入らなかった。追跡されているファイルの欠落はなし |
| 同じ入力で2回梱包 | digest は2回とも 2e07c3f6…125a で一致（固定時刻） |
| 合否判定スクリプト（実際のJUnit、119件） | 合格（exit 0）。存在しないファイルでは判定不能（exit 2） |
| 未実施 | plan・apply・state 操作、Azure・Azure DevOps への接続、パイプラインの登録・実行、Bash の手順のエージェント上での実行、Terraform 配布物の GPG 署名の検証 |

## 7-4 の後のローカル確認（試走担当が実行。対象は 3f5ac77 でコミットした内容）

| 確認 | 実際の結果 |
| --- | --- |
| terraform fmt -check・init -backend=false・validate（環境変数と見本ファイルを追加した後） | すべて成功（exit 0）。dev.tfvars.example と stg.tfvars.example は値が空欄の見本 |
| YAML の解析（cd-draft.yml・ci.yml） | errors=0。cd-draft.yml は trigger: none、pr: none、入力は実行ID・成果物名・digest・コミットの4つ。テンプレート式（${{ each }} など）を Azure Pipelines が受け付けるかは未確認 |
| 514fc97 の別の確認用コピーで ZIP を作成 | digest 714087fc…da83、コミット 514fc97c… |
| 同じ ZIP を dev・stg の2つの論理環境で照合 | どちらも合格（exit 0）。照合の前後で ZIP の digest と更新時刻は変わらず、再ビルドしていない |
| 選んだ digest と違う値を指定 | 拒否（exit 1） |
| 選んだコミットと違う値を指定 | 拒否（exit 1） |
| 中身を1行変えて manifest と .sha256 も作り直した ZIP を、選んだ digest で照合 | 拒否（exit 1） |
| 対照：改ざん版を、その改ざん版の digest を選んで照合 | 合格（exit 0）。照合は「人が選んだ値」を基準にするため、選ぶ値を誤ると防げない |
| 梱包スクリプトの禁止ファイルの扱い | 7-4 では変更なし。前回の確認どおり、request_portal/ 内の .env.local・secrets.json・notes.db は ZIP に入る |
| 未実施 | plan・apply・state 操作、Azure・Azure DevOps への接続、パイプラインの登録・実行 |
