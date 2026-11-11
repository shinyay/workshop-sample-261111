# 第7章 7-5：レビュー担当の横断レビュー（最終回答）

試走の会話b0377390で、レビュー担当が返した最終回答の写しです（続行の確認の後の回答を含む）。

session=b0377390 title=第7章レビュー依頼 requests=2 file=session-234955-b0377390.json
[portal-reviewer/copilot/gpt-6.1-terra/max/872000] in=99992 credits=2.599425 ms=42161 canceled= instr=[]
tools:
--- response
**指摘**
作業コピーと記録された版のハッシュは再照合できていないため、以下は条件付きの所見です。特記のないものは要件と定義の照合です。

1. **高・DR-01/06/08**: 品質確認時の変更と追加定義は未コミットです。追加後の記録では Ruff が7件、整形確認が7ファイル失敗しており、同じ結果なら CI は梱包に進めません。`review-input/ch7-review.md#L10` `pipelines/ci.yml#L86`
2. **高・DR-02/05/11**: 起動・依存準備・非公開経路が未定義で、アプリはループバック待受かつ Host
2. **高・DR-02/05/11**: 起動・依存準備・非公開経路が未定義で、アプリはループバック待受かつ Host を制限します。配備先で動くことは示せません。これは資料にも明記された適合不足です。`infra/main.tf#L26` `request_portal/__main__.py#L75` `request_portal/__init__.py#L96`
3. **中・DR-01/07/08**: `git status` が標準出力なしで失敗すると、条件式は偽となり確認を通過し得ます。梱包側にも同じ判定があります。Bash の参照仕様と実行による確認は未実施です。`pipelines/ci.yml#L45` `pipelines/ci.yml#L128`
4. **中・DR-07**: 補助テストは件数やスキップを判定せず、アプリの pytest 件数にも含まれません。補助テストが0件またはスキップでも成功扱いになる可能性があります。unittest の参照仕様は未照合です。`pipelines/ci.yml#L77` `pyproject.toml#L21`
5. **中・DR-03/05**: Terraform は Python 3.13 を選べますが、CI は3.14のみです。3.13を選んだ環境に3.14の確認結果を流用できません。`infra/variables.tf#L66` `pipelines/ci.yml#L55`
6. **中・DR-04**: `` の除外設定はルートの `.env` や state に適用されません。別の除外策は未確認で、追跡されるおそれがあります。`.gitignore#L1` `infra/.gitignore#L1`
7. **中・DR-08/12**: ZIP 検証は全必須モジュールやテンプレートを要求せず、起動確認もしません。必要ファイルを欠いた ZIP を承認すれば照合成功後も起動できない可能性があります。現在の ZIP に欠落があるとは確認していません。`pipelines/package_artifact.py#L59` `pipelines/verify_artifact.py#L77`
8. **低・DR-10**: 引き継ぎ文書の「CDの定義は未設定」「今回、品質確認は未実施」は、停止専用の定義案や後の実行記録との時点の区別が不明瞭です。`infra/README.md#L71` `review-input/ch7-review.md#L44`

**影響**
| DR | 対応と残る範囲 |
| --- | --- |
| 01 | `pipelines/ci.yml#L36` はコミットを照合し、`pipelines/package_artifact.py#L109` に記録。未コミット版との同一性は未確定。 |
| 02 | `infra/main.tf#L11` に限定。接続・起動適合は未決。 |
| 03 | `pipelines/ci.yml#L55` は3.14、`infra/variables.tf#L66` は3.13も許容。Linux上のプロバイダー再現性も未確認。 |
| 04 | `pipelines/package_artifact.py#L15` は禁止ファイルを除外。リポジトリ全体と許可されたソース内の秘密は別問題。 |
| 05 | `infra/variables.tf#L1` と`infra/outputs.tf#L1` を定義。実値と CD への受け渡しは未設定。 |
| 06 | `pipelines/ci.yml#L79` を定義。追加後の Ruff 失敗が残る。 |
| 07 | `pipelines/check_junit.py#L24` は件数・失敗・スキップを検査。ただし補助テストと必須ケースの個別同一性は保証しない。 |
| 08 | `pipelines/ci.yml#L133` を限定して梱包。ZIPからの起動は未確認。 |
| 09 | `pipelines/cd.yml#L59` は停止専用で、配備しない案。登録・実行は未実施。 |
| 10 | `infra/README.md#L69` を記載。ただし上記の時点の曖昧さがある。 |
| 11 | `infra/README.md#L45` はあるが、backend・環境別対応表・対象照合は未設定。 |
| 12 | `pipelines/verify_artifact.py#L37` は識別情報と digest を照合。実際の取得元確認と CD 連携は未実装。 |
| 13 | `pipelines/ci.yml#L1` は手動想定。連携先やサービス側のトリガー設定は未決。 |

**追加確認**
- 現在と実行時の完全な HEAD、差分ハッシュ、未追跡を含む状態と各ファイルのハッシュを、提供記録と照合してください。
- 担当者に Bash・unittest、Azure Pipelines の条件式とトリガー、App Service とプロバイダーの公式仕様を確認してもらってください。
- 許可された一時コピーで判定失敗時・補助テスト0件・ZIPからの起動を確認し、3.13を選ぶ場合はその版でも品質確認してください。
- Azure の登録・接続・実行は今回行わず、将来別途許可された範囲で対象・承認・state・取得経路を確認してください。

**未確認事項**
参加者の記録では Terraform のローカル検証、YAML解析2件、補助テスト35件、ZIPのローカル照合は成功、Ruffの2確認は失敗、mypyはアプリ本体について成功です。私は実行していません。194件の JUnit レポートの生成版と現在の版の一致、公式参照仕様、Azure・Azure DevOps上の動作は未確認です。`review-input/ch7-review.md#L38`
