# Simple Game 1

ブラウザで遊べる、見下ろし型アクションRPGの最小プロトタイプです。

## 操作方法

- 移動: テンキー または `W` / `A` / `S` / `D`
- 攻撃: `Space`
- メニュー/ポーズ: `Esc`

## 開発コマンド

```bash
npm run build
npm test
npm run serve
```

`npm run build` で TypeScript を `dist/` に出力します。`npm run serve` の後、ブラウザで <http://localhost:5173/> を開くとプレイできます。

## 実装メモ

- 初期実装は依存パッケージなしの TypeScript + Canvas API です。
- 斜め移動は速度が速くなりすぎないように正規化しています。
- MVP では回避とスキルを入れず、移動・通常攻撃・メニューに絞っています。
