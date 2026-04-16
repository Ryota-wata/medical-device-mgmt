# work 配下の扱い

この配下には、正本ではない作業用・検証用の資材を置く。

## 現在の配置
- `poc-print-agent`
  - テプラ印刷連携の PoC
- `poc-survey-offline-mock`
  - 現有品調査オフライン動作の PoC
- `pjt-archaic-medical-dx`
  - 医療DX系の検証 notebook をまとめた作業ディレクトリ
  - `PoC1/notebooks` にはコサイン類似度ベースの検証 notebook（`cosine_similarity.ipynb`、`cosine_similarity_top_n_gpt.ipynb`）を配置
  - `PoC2/notebooks` には `fine_tuning` / `llm` / `machine_learning` 配下の検証 notebook（`studio_ousia_luke_japanese_base.ipynb`、`chatgpt.ipynb`、`fasttext.ipynb`）を配置

## 運用
- 正本の仕様・設計書・生成テンプレートは置かない。
- 一時検証物や PoC を root 直下に置かず、必要に応じてここへ集約する。
