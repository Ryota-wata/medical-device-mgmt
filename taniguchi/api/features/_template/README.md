# 機能別API設計テンプレート

このディレクトリを`features/<feature-slug>/`へ複製し、プレースホルダーを対象機能の値へ置き換える。

## 作成順序

1. `catalog.yaml`の対象機能を確認する。
2. `feature.yaml`へ機能ID、slug、画面、関連ファイル、Word出力先を設定する。
3. `openapi.yaml`へ外部I/F契約を記載する。
4. `design.md`へ画面、DB、権限、処理、業務ルールを記載する。
5. OpenAPIとマニフェストを検証する。
6. 要件・DBとの整合を確認する。
7. Wordをドラフト生成して内容と体裁を確認する。
8. 検証完了後に`catalog.yaml`の`authoringMode`を`openapi`へ切り替える。

`authoringMode`は移行完了前に切り替えない。

