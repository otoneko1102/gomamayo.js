# gomamayo

MeCab不要のゴママヨ検出ライブラリ

## Install

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

// 1次ゴママヨの例
const result1 = await analyze('ごまマヨネーズ');
console.log(result1.isGomamayo); // true
console.log(result1.degree);     // 1
console.log(result1.matches[0].words); // ['ごま', 'マヨネーズ']

// 2次ゴママヨの例（固有名詞も検出可能）
const result2 = await analyze('博麗霊夢');
console.log(result2.isGomamayo); // true
console.log(result2.degree);     // 2
console.log(result2.matches[0].readings); // ['ハクレイ', 'レイム']
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
