# APIサンプル

OpenAPIから分離する必要がある大きなRequest／Response例を配置する。

- ファイル名は`<operationId>-request.json`または`<operationId>-response-<status>.json`とする。
- OpenAPIから相対`$ref`で参照する。
- 実データ、患者情報、顧客機密情報を含めない。
- schemaと一致する合成データだけを使用する。

