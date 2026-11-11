# 第三者著作物と制作上の参照

## MOAW Copilot Kit

- 出典: [shinyay/moaw-copilot-kit](https://github.com/shinyay/moaw-copilot-kit)
- 固定版: [`a1bad8fe077d768c7ab860ad5ddfd9a766064c57`](https://github.com/shinyay/moaw-copilot-kit/commit/a1bad8fe077d768c7ab860ad5ddfd9a766064c57)
- `authoring/moaw-workshop`は、同版の`skills/moaw-workshop`全12ファイルを内容を変更せず再配置したものです。
- Skill本文、参照、テンプレート、同梱SVGには[CC BY-SA 4.0](authoring/moaw-workshop/LICENSE)が適用されます。[元の著者・出典・変更表示](authoring/moaw-workshop/references/sources.md)を保持しています。
- `scripts/build.mjs`のHTMLシェル処理は、同版の`scripts/build-site.mjs`を参考に、ローカル表示に必要な追跡除去・表示設定へ範囲を絞っています。元のコードの[MIT License](authoring/MOAW-Copilot-Kit-MIT.txt)を保持しています。

キットはコミュニティによる制作支援です。本教材・キットについてGitHubやMicrosoftの推奨・承認を示すものではありません。
本教材の本文はこのリポジトリの既存設計から作成し、教材のSVGはその内容に合わせて新規作成しています。既存の設計文書に、キットのライセンスを一括適用するものではありません。

## MOAW公式ビューア

- 出典: [microsoft/moaw](https://github.com/microsoft/moaw)
- 使用する配布物: `@moaw/cli` **1.6.1**、同梱ビューア **`sha.9deeac0`**
- 調査用の公開ソース版: `99e0e09fd5f5f6c2324aa679967d10910014640c`。同梱ビューアと同一版とは扱いません。
- ライセンス: [MOAW MIT License](authoring/MOAW-MIT.txt)。配布物内のライセンス表示も生成物へ保持します。

ビューア本体のJS/CSSは変更しません。ローカル表示用HTMLシェルではClarityの追跡タグとGitHub Pages固有のbase上書きを除き、文書の言語と初期タイトルを教材に合わせます。生成時に配布物のハッシュを記録します。
このリポジトリ独自の`scripts/viewer/workshop-presentation.js`とCSSを別ファイルとして読み込み、作成者情報とリンクのない教材名・版番号のフッターを表示します。作成者欄のOctocatは、公式ビューアが描画するGitHubアイコンを複製して使用します。表示補助を追加しても、公式配布物と同梱ライセンスは変更せず保持します。
MOAWでローカル表示できることは、教材の公開・配布や実習の実行成功を意味しません。

その他の制作依存の版は`package-lock.json`、ライセンスは各パッケージに同梱された表示で確認できます。
