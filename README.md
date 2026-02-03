# gomamayo

MeCab不要のゴママヨ検出ライブラリ

[kuromoji.js](https://www.npmjs.com/package/kuromoji) とそのdict、 [kuromoji-ipadic-neologd](https://www.npmjs.com/package/kuromoji-neologd) のdict を使用して精度を向上させています。  
固有名詞のゴママヨも一応検出可能です。

> [!NOTE]
> 使用している辞書のサイズが非常に大きく、導入のためのスクリプトが特殊なため、開発者の環境ではインストールに3分ほど要しました。
> [実際に開発者の環境にインストールしてみた動画(3分程度)](./assets/video/install-gomamayo-rta.mp4)

## Install

以下の操作のみで使用できるはずです。

```bash
npm install gomamayo
```

## Usage

### プログラムから使用

```js
// ESM
import { analyze } from 'gomamayo';
// CJS
const { analyze } = require('gomamayo');

(async () => {
  // 1次ゴママヨの例
  const result1 = await analyze('ごまマヨネーズ');
  console.log(result1.isGomamayo); // true
  console.log(result1.degree); // 1
  console.log(result1.matches[0].words); // ['ごま', 'マヨネーズ']

  // 2次ゴママヨの例
  const result2 = await analyze('博麗霊夢');
  console.log(result2.isGomamayo); // true
  console.log(result2.degree); // 2
  console.log(result2.matches[0].readings); // ['ハクレイ', 'レイム']
})();
```

### オプション

```javascript
// 高次ゴママヨを検出しない（1次のみ）
await analyze('博麗霊夢', { higher: false });

// 多項ゴママヨを検出しない（最初の1項のみ）
await analyze('太鼓公募募集終了', { multi: false });
```

## CLI

```bash
# 1次ゴママヨ
npx gomamayo ごまマヨネーズ

# 2次ゴママヨ
npx gomamayo 博麗霊夢

# オプション
npx gomamayo 博麗霊夢 --higher false  # 高次検出なし
npx gomamayo 太鼓公募募集終了 --multi false  # 多項検出なし
```

## API

### `analyze(input, options?)`

ゴママヨを解析して詳細な結果を返します。

### `isGomamayo(input, options?)`

ゴママヨかどうかを `boolean` で返します。

### `find(input, options?)`

ゴママヨの場合は `GomamayoMatch[]` を、そうでなければ `null` を返します。

## 参考

- https://3qua9la-notebook.hatenablog.com/entry/2021/04/10/220317
- https://github.com/Hayao0819/Awesome-Gomamayo
- https://github.com/jugesuke/gomamayo
- https://github.com/ThinaticSystem/gomamayo.js
  - https://www.npmjs.com/package/gomamayo-js

> [!WARNING]
> このパッケージは Apache License 2.0 の依存ライブラリ（[kuromoji.js](https://www.npmjs.com/package/kuromoji) および [kuromoji-ipadic-neologd](https://www.npmjs.com/package/kuromoji-neologd)）を使用しています。このパッケージ自体は MIT License ですが、これらの依存関係のライセンス条項も適用されます。
