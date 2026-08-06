# OpenAPI共通定義

複数機能で同一の意味と構造を持つOpenAPI部品を管理する。
機能固有のschemaやエラーを安易に共通化せず、2機能以上で同じ契約として再利用できる場合だけ配置する。

## 現在の共通部品

- `schemas/error-response.yaml`
  - API共通エラーの基本構造
- `security/bearer-auth.yaml`
  - Bearer認証のsecurity scheme

## 利用例

機能別`openapi.yaml`から、機能ディレクトリを基準に参照する。

```yaml
components:
  securitySchemes:
    BearerAuth:
      $ref: ../../common/security/bearer-auth.yaml
  schemas:
    ErrorResponse:
      $ref: ../../common/schemas/error-response.yaml
```

## ルール

- 共通部品の変更は全参照機能へ影響するため、変更前に参照先を確認する。
- 後方互換性を壊す変更は、既存部品を直接変更する前に影響範囲を明示する。
- `description`だけが異なるHTTPレスポンスは、operation側で記載しschemaのみ共通化する。
- DB物理名や内部処理手順は共通OpenAPI部品へ含めない。

