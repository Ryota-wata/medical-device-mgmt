import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { dump as dumpYaml } from "js-yaml";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value || value.startsWith("--")) {
      throw new Error("Usage: node convert-legacy-api-spec-to-openapi.mjs --legacy <legacy.json> --output <openapi.yaml> --title <title> --version <version> --tag <tag> --feature-code <code>");
    }
    args[key.slice(2)] = value;
    index += 1;
  }
  for (const required of ["legacy", "output", "title", "version", "tag", "feature-code"]) {
    if (!args[required]) {
      throw new Error(`Missing --${required}`);
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8").replace(/^\uFEFF/, ""));
}

function clean(value) {
  return String(value ?? "").replace(/`([^`]+)`/g, "$1").trim();
}

function normalizeRows(rows, columnCount) {
  if (rows === undefined || rows === null) {
    return [];
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  const flattened = rows.flatMap((row) => {
    if (Array.isArray(row)) {
      return row;
    }
    if (row && typeof row === "object" && Array.isArray(row.value)) {
      return row.value;
    }
    return [row];
  });
  if (flattened.length % columnCount === 0) {
    const normalized = [];
    for (let index = 0; index < flattened.length; index += columnCount) {
      normalized.push(flattened.slice(index, index + columnCount));
    }
    return normalized;
  }
  throw new Error(`Cannot normalize ${flattened.length} values into ${columnCount} columns`);
}

function hasSemanticRequestBody(endpoint) {
  const rows = normalizeRows(endpoint.RequestRows, 4);
  return rows.length > 0 && !rows.every((row) => (
    clean(row[0]) === "-" && clean(row[1]) === "-" && clean(row[2]) === "-"
  ));
}

function pascalToken(value) {
  return String(value)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part.length === 1 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1))
    .join("");
}

function operationId(method, apiPath) {
  let suffix = "";
  for (const segment of apiPath.replace(/^\/+|\/+$/g, "").split("/")) {
    const parameter = segment.match(/^\{(.+)\}$/);
    suffix += parameter ? `By${pascalToken(parameter[1])}` : pascalToken(segment);
  }
  return `${method.toLowerCase()}${suffix}`;
}

function featureOperationId(method, apiPath, prefix) {
  const base = operationId(method, apiPath);
  const normalizedPrefix = clean(prefix);
  return normalizedPrefix
    ? `${normalizedPrefix}${base[0].toUpperCase()}${base.slice(1)}`
    : base;
}

function schemaNameFromTitle(title, fallback) {
  const text = clean(title);
  const fullWidth = [...text.matchAll(/（([^（）]+)）/g)].at(-1)?.[1];
  const ascii = [...text.matchAll(/\(([^()]+)\)/g)].at(-1)?.[1];
  const candidate = fullWidth ?? ascii;
  if (!candidate) {
    return fallback;
  }
  const afterColon = candidate.split(/[：:]/).at(-1).trim();
  if (afterColon === "No Content" || /^[a-z][a-z0-9.+-]*\/[a-z0-9.+-]+$/i.test(afterColon)) {
    return fallback;
  }
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(afterColon) ? afterColon : fallback;
}

function requestMediaType(title) {
  const text = clean(title).toLowerCase();
  return text.includes("multipart/form-data") ? "multipart/form-data" : "application/json";
}

function explicitResponseMediaTypes(endpoint) {
  const mediaTypes = new Set();
  for (const table of endpoint.ResponseSubtables ?? []) {
    const headers = (table.Headers ?? []).map((value) => clean(value).toLowerCase());
    const nameIndex = headers.indexOf("ヘッダー名");
    const formatIndex = headers.indexOf("形式");
    if (nameIndex < 0 || formatIndex < 0) {
      continue;
    }
    for (const row of normalizeRows(table.Rows, headers.length)) {
      if (clean(row[nameIndex]).toLowerCase() === "content-type") {
        const mediaType = clean(row[formatIndex]);
        if (mediaType) {
          mediaTypes.add(mediaType);
        }
      }
    }
  }
  const responseTexts = [endpoint.ResponseTitle, ...(endpoint.ResponseLines ?? [])];
  for (const line of responseTexts) {
    for (const match of String(line).matchAll(/\b(?:application|audio|image|text|video)\/[A-Za-z0-9.+-]+\b/g)) {
      mediaTypes.add(match[0]);
    }
  }
  return [...mediaTypes];
}

function responseMediaTypes(endpoint) {
  const mediaTypes = explicitResponseMediaTypes(endpoint);
  return mediaTypes.length > 0 ? mediaTypes : ["application/octet-stream"];
}

function isBinaryResponse(endpoint, schemaName) {
  if (/^(?:binary|file)$|binary|バイナリ/i.test(schemaName)
      || /^(?:application|audio|image|text|video)\/[A-Za-z0-9.+-]+$/i.test(schemaName)) {
    return true;
  }
  return explicitResponseMediaTypes(endpoint)
    .some((mediaType) => !/^application\/(?:[a-z0-9.+-]*\+)?json(?:\s*;|$)/i.test(mediaType));
}

function explicitFeatureCodesFromEndpoint(endpoint, allowedFeatureCodes = []) {
  const featureCodes = [];
  const allowed = new Set(allowedFeatureCodes);
  for (const line of endpoint.PermissionLines ?? []) {
    const text = String(line ?? "");
    if (allowed.size > 0) {
      for (const match of text.matchAll(/`([a-z][a-z0-9_]*)`/gi)) {
        if (allowed.has(match[1]) && !featureCodes.includes(match[1])) {
          featureCodes.push(match[1]);
        }
      }
      continue;
    }
    const matches = [
      ...text.matchAll(/両方で\s*`([a-z][a-z0-9_]*)`\s*が有効/gi),
      ...text.matchAll(/実効\s*`([a-z][a-z0-9_]*)`/gi),
      ...text.matchAll(/`([a-z][a-z0-9_]*)`\s*(?:が有効|判定)/gi),
    ];
    for (const match of matches) {
      if (!featureCodes.includes(match[1])) {
        featureCodes.push(match[1]);
      }
    }
  }
  return featureCodes;
}

function authorizationFromEndpoint(endpoint, fallbackFeatureCode, allowedFeatureCodes = []) {
  const permissionLines = (endpoint.PermissionLines ?? [])
    .map((line) => String(line ?? ""));
  const permissionText = permissionLines.join(" ");
  const explicitFeatureCodes = explicitFeatureCodesFromEndpoint(endpoint, allowedFeatureCodes);
  if (explicitFeatureCodes.length > 1) {
    const isConditional = permissionLines.some((line) => (
      /(?:listType|list_type)[^。]*(?:場合|に応じて)/i.test(line)
      || /いずれか/.test(line)
      || /`[a-z][a-z0-9_]*`\s*または\s*`[a-z][a-z0-9_]*`/i.test(line)
    ));
    if (isConditional) {
      return { mode: "dynamic", featureCodes: explicitFeatureCodes };
    }
    return { mode: "feature-code-all", featureCodes: explicitFeatureCodes };
  }
  if (explicitFeatureCodes.length === 1) {
    return { mode: "feature-code", featureCode: explicitFeatureCodes[0] };
  }

  if (/共有システム管理者アカウント/.test(permissionText)
      && /(?:であること|のみ実行を許可|のみ利用可能)/.test(permissionText)) {
    return { mode: "system-admin", featureCode: null };
  }

  return { mode: "feature-code", featureCode: fallbackFeatureCode };
}

function splitFixedQuery(apiPath) {
  const queryIndex = apiPath.indexOf("?");
  if (queryIndex < 0) {
    return { path: apiPath, parameters: [] };
  }
  const normalizedPath = apiPath.slice(0, queryIndex);
  const parameters = [];
  for (const pair of apiPath.slice(queryIndex + 1).split("&")) {
    if (!pair) continue;
    const [rawName, rawValue = ""] = pair.split("=", 2);
    const name = decodeURIComponent(rawName);
    const value = decodeURIComponent(rawValue);
    parameters.push({
      name,
      in: "query",
      required: true,
      description: `固定値: ${value}`,
      schema: { type: "string", enum: [value] },
      "x-word-required-label": "✓",
    });
  }
  return { path: normalizedPath, parameters };
}

function summaryFromTitle(title, apiPath) {
  return clean(title)
    .replace(new RegExp(`（${apiPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}）$`), "")
    .replace(new RegExp(`\\(${apiPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)$`), "")
    .trim();
}

function collectEndpoints(legacy) {
  const endpoints = [];
  for (const section of legacy.Sections ?? []) {
    if (section.Type === "EndpointBlocks") {
      endpoints.push(...(section.Items ?? []));
    }
  }
  return endpoints;
}

function subtableMatchesProperty(table, propertyName, childName) {
  const title = clean(table?.Title);
  const titlePrefix = title.split(/(?:配列)?要素/)[0];
  const propertyNames = titlePrefix.split("/").map((value) => value.trim());
  return propertyNames.includes(propertyName)
    || schemaNameFromTitle(title, "Object") === childName;
}

function upsertSchemaDefinition(definitions, name, definition) {
  const existing = definitions.get(name);
  if (!existing) {
    definitions.set(name, definition);
    return;
  }

  const mergedSubtables = [...(existing.subtables ?? [])];
  for (const table of definition.subtables ?? []) {
    const title = clean(table?.Title);
    if (!mergedSubtables.some((candidate) => clean(candidate?.Title) === title)) {
      mergedSubtables.push(table);
    }
  }
  definitions.set(name, {
    rows: (definition.rows ?? []).length > 0 ? definition.rows : existing.rows,
    subtables: mergedSubtables,
  });
}

function schemaFingerprint(definition) {
  return JSON.stringify({
    rows: definition.rows ?? [],
    subtables: (definition.subtables ?? []).map((table) => ({
      title: clean(table.Title),
      headers: (table.Headers ?? []).map(clean),
      rows: normalizeRows(table.Rows, (table.Headers ?? []).length).map((row) => row.map(clean)),
    })),
  });
}

function resolveEndpointSchemaNames(endpoints) {
  const occurrences = new Map();
  const requestNames = new Map();
  const responseNames = new Map();

  function addOccurrence(endpoint, kind, baseName, definition) {
    occurrences.set(baseName, [
      ...(occurrences.get(baseName) ?? []),
      { endpoint, kind, definition },
    ]);
  }

  for (const endpoint of endpoints) {
    if (hasSemanticRequestBody(endpoint)) {
      const fallback = `${pascalToken(operationId(endpoint.Method, endpoint.Path))}Request`;
      addOccurrence(endpoint, "request", schemaNameFromTitle(endpoint.RequestTitle, fallback), {
        rows: normalizeRows(endpoint.RequestRows, 4),
        subtables: endpoint.RequestSubtables ?? [],
      });
    }
    if (normalizeRows(endpoint.ResponseRows, 4).length > 0) {
      const successRow = normalizeRows(endpoint.StatusRows, 3).find((row) => /^2\d\d$/.test(clean(row[0])));
      const fallback = clean(successRow?.[2]) || `${pascalToken(summaryFromTitle(endpoint.Title, endpoint.Path))}Response`;
      addOccurrence(endpoint, "response", schemaNameFromTitle(endpoint.ResponseTitle, fallback), {
        rows: normalizeRows(endpoint.ResponseRows, 4),
        subtables: endpoint.ResponseSubtables ?? [],
      });
    }
  }

  for (const [baseName, items] of occurrences) {
    const fingerprints = new Set(items.map((item) => schemaFingerprint(item.definition)));
    for (const item of items) {
      const resolvedName = fingerprints.size === 1
        ? baseName
        : `${pascalToken(operationId(item.endpoint.Method, item.endpoint.Path))}${item.kind === "request" ? "Request" : "Response"}`;
      (item.kind === "request" ? requestNames : responseNames).set(item.endpoint, resolvedName);
    }
  }

  return { requestNames, responseNames };
}

function collectSchemaDefinitions(legacy, endpoints, endpointSchemaNames) {
  const definitions = new Map();
  for (const endpoint of endpoints) {
    if (hasSemanticRequestBody(endpoint)) {
      upsertSchemaDefinition(definitions, endpointSchemaNames.requestNames.get(endpoint), {
        rows: normalizeRows(endpoint.RequestRows, 4),
        subtables: endpoint.RequestSubtables ?? [],
      });
    }
    if (normalizeRows(endpoint.ResponseRows, 4).length > 0) {
      upsertSchemaDefinition(definitions, endpointSchemaNames.responseNames.get(endpoint), {
        rows: normalizeRows(endpoint.ResponseRows, 4),
        subtables: endpoint.ResponseSubtables ?? [],
      });
    }
    for (const subtable of [...(endpoint.RequestSubtables ?? []), ...(endpoint.ResponseSubtables ?? [])]) {
      const name = schemaNameFromTitle(subtable.Title, "Object");
      if (name !== "Object") {
        upsertSchemaDefinition(definitions, name, {
          rows: normalizeRows(subtable.Rows, 4),
          subtables: [],
        });
      }
    }
  }

  // Some legacy documents define reusable DTOs as ordinary Heading3 + Table
  // sections outside EndpointBlocks. Include those tables in components so a
  // field such as `currentSettings: PermissionFacilitySettingsResponse` does
  // not degrade to a plain string during conversion.
  const sections = legacy.Sections ?? [];
  for (let index = 0; index < sections.length - 1; index += 1) {
    const heading = sections[index];
    const table = sections[index + 1];
    if (heading.Type !== "Heading3" || table.Type !== "Table") {
      continue;
    }
    const headers = (table.Headers ?? []).map(clean);
    if (headers.length !== 4 || headers.join("|") !== "フィールド|型|必須|説明") {
      continue;
    }
    const headingText = clean(heading.Text);
    const name = /^[A-Za-z][A-Za-z0-9_]*$/.test(headingText)
      ? headingText
      : schemaNameFromTitle(headingText, "Object");
    if (name !== "Object") {
      upsertSchemaDefinition(definitions, name, {
        rows: normalizeRows(table.Rows, 4),
        subtables: [],
      });
    }
  }

  // Legacy Word specs list nested schema tables as siblings. Reconstruct the
  // actual parent/child relationship so the OpenAPI schema remains semantic,
  // while the Word model can flatten the same tables back in the same order.
  for (const endpoint of endpoints) {
    for (const subtables of [endpoint.RequestSubtables ?? [], endpoint.ResponseSubtables ?? []]) {
      for (const parentTable of subtables) {
        const parentName = schemaNameFromTitle(parentTable.Title, "Object");
        const parent = definitions.get(parentName);
        if (!parent) {
          continue;
        }
        for (const row of parent.rows) {
          const propertyName = clean(row[0]);
          const childName = clean(row[1]).replace(/\[\]$/, "");
          const childTable = subtables.find((table) => (
            table !== parentTable && subtableMatchesProperty(table, propertyName, childName)
          ));
          if (childTable && !parent.subtables.includes(childTable)) {
            parent.subtables.push(childTable);
          }
        }
      }
    }
  }
  return definitions;
}

function scalarSchema(typeText, knownSchemas) {
  const type = clean(typeText);
  if (type.endsWith("[]")) {
    return { type: "array", items: scalarSchema(type.slice(0, -2), knownSchemas) };
  }
  switch (type.toLowerCase()) {
    case "boolean":
      return { type: "boolean" };
    case "int32":
      return { type: "integer", format: "int32" };
    case "int64":
      return { type: "integer", format: "int64" };
    case "integer":
    case "int":
      return { type: "integer" };
    case "number":
    case "decimal":
      return { type: "number" };
    case "date":
      return { type: "string", format: "date" };
    case "datetime":
    case "date-time":
      return { type: "string", format: "date-time" };
    case "binary":
    case "file":
      return { type: "string", format: "binary" };
    case "object":
    case "json":
      return { type: "object", additionalProperties: true };
    default:
      return knownSchemas.has(type)
        ? { $ref: `#/components/schemas/${type}` }
        : { type: "string" };
  }
}

function buildObjectSchema(definition, knownSchemas) {
  const required = [];
  const properties = {};
  const availableSubtables = [...(definition.subtables ?? [])];

  function consumeNestedSubtables(parentTable) {
    for (const row of normalizeRows(parentTable?.Rows, 4)) {
      const propertyName = clean(row[0]);
      const childName = clean(row[1]).replace(/\[\]$/, "");
      const childIndex = availableSubtables.findIndex((table) => (
        subtableMatchesProperty(table, propertyName, childName)
      ));
      if (childIndex < 0) {
        continue;
      }
      const [childTable] = availableSubtables.splice(childIndex, 1);
      consumeNestedSubtables(childTable);
    }
  }

  for (const row of definition.rows ?? []) {
    const [nameRaw, typeRaw, requiredRaw, descriptionRaw] = row;
    const name = clean(nameRaw);
    if (!name || name === "-") {
      continue;
    }
    const property = scalarSchema(typeRaw, knownSchemas);
    property.description = clean(descriptionRaw) || "-";
    const requiredLabel = clean(requiredRaw);
    if (requiredLabel && requiredLabel !== "-" && requiredLabel !== "✓") {
      property["x-word-required-label"] = requiredLabel;
    }
    const nestedType = property.type === "array" ? property.items : property;
    if (nestedType?.$ref) {
      const childName = clean(typeRaw).replace(/\[\]$/, "");
      const tableIndex = availableSubtables.findIndex((table) => (
        subtableMatchesProperty(table, name, childName)
      ));
      if (tableIndex >= 0) {
        const [matchedTable] = availableSubtables.splice(tableIndex, 1);
        property["x-word-subtable-title"] = clean(matchedTable.Title);
        consumeNestedSubtables(matchedTable);
      }
      else {
        property["x-word-omit-subtable"] = true;
      }
    }
    properties[name] = property;
    if (clean(requiredRaw) === "✓") {
      required.push(name);
    }
  }

  // Some legacy specifications use supplemental field tables for conditional
  // request members (for example NEW-only / REISSUE-only inputs) instead of a
  // nested object. Keep those members in the OpenAPI schema, while retaining
  // the supplemental table as the authoritative Word presentation below.
  for (const table of availableSubtables) {
    const headers = (table.Headers ?? []).map(clean);
    if (headers.length !== 4
      || headers[0] !== "フィールド"
      || headers[1] !== "型"
      || headers[2] !== "必須"
      || headers[3] !== "説明") {
      continue;
    }
    for (const row of normalizeRows(table.Rows, 4)) {
      const [nameRaw, typeRaw, requiredRaw, descriptionRaw] = row;
      const name = clean(nameRaw);
      if (!name || name === "-" || properties[name]) {
        continue;
      }
      const property = scalarSchema(typeRaw, knownSchemas);
      property.description = clean(descriptionRaw) || "-";
      property["x-word-omit-row"] = true;
      property["x-required-when"] = clean(table.Title);
      const requiredLabel = clean(requiredRaw);
      if (requiredLabel && requiredLabel !== "-") {
        property["x-word-required-label"] = requiredLabel;
      }
      properties[name] = property;
    }
  }
  const schema = { type: "object", additionalProperties: false };
  if (required.length > 0) {
    schema.required = required;
  }
  schema.properties = properties;
  return schema;
}

function buildWordSubtables(tables) {
  return (tables ?? []).map((table) => {
    const headers = (table.Headers ?? []).map(clean);
    return {
      Title: clean(table.Title),
      Headers: headers,
      Rows: normalizeRows(table.Rows, headers.length).map((row) => row.map(clean)),
    };
  });
}

function isPlaceholderParameterRow(row) {
  const [name, where, type, required] = row.map(clean);
  return [name, where, type, required].every((value) => value === "-" || value === "");
}

function buildParameters(endpoint, knownSchemas) {
  return normalizeRows(endpoint.ParametersRows, 5)
    .filter((row) => !isPlaceholderParameterRow(row))
    .filter((row) => clean(row[1]).toLowerCase() !== "formdata").map((row) => {
    const [name, where, type, required, description] = row.map(clean);
    const parameter = {
      name,
      in: where,
      required: where === "path" || required === "✓",
      description,
      schema: scalarSchema(type, knownSchemas),
    };
    if (required && !["✓", "-"].includes(required)) {
      parameter["x-word-required-label"] = required;
    }
    return parameter;
  });
}

function buildFormDataRequestBody(endpoint, knownSchemas) {
  const rows = normalizeRows(endpoint.ParametersRows, 5)
    .filter((row) => clean(row[1]).toLowerCase() === "formdata");
  if (rows.length === 0) {
    return null;
  }
  const required = [];
  const properties = {};
  for (const row of rows) {
    const [name, , type, requiredLabel, description] = row.map(clean);
    properties[name] = { ...scalarSchema(type, knownSchemas), description };
    if (requiredLabel === "✓") {
      required.push(name);
    }
  }
  const schema = { type: "object", additionalProperties: false, properties };
  if (required.length > 0) {
    schema.required = required;
  }
  return {
    required: required.length > 0,
    content: {
      "multipart/form-data": { schema },
    },
  };
}

function buildResponses(endpoint, responseSchemaName, legacyResponseSchemaName, knownSchemas) {
  const responses = {};
  for (const row of normalizeRows(endpoint.StatusRows, 3)) {
    const [status, description, schemaName] = row.map(clean);
    const response = { description: description || "-" };
    if (/^2\d\d$/.test(status) && isBinaryResponse(endpoint, schemaName)) {
      response.content = Object.fromEntries(
        responseMediaTypes(endpoint).map((mediaType) => [
          mediaType,
          { schema: { type: "string", format: "binary" } },
        ]),
      );
    }
    else if (schemaName && schemaName !== "-") {
      let resolvedSchemaName = responseSchemaName && schemaName === legacyResponseSchemaName
        ? responseSchemaName
        : schemaName;
      if (!/^2\d\d$/.test(status) && !knownSchemas.has(resolvedSchemaName)) {
        resolvedSchemaName = "ErrorResponse";
      }
      response.content = {
        "application/json": {
          schema: { $ref: `#/components/schemas/${resolvedSchemaName}` },
        },
      };
    }
    responses[status] = response;
  }
  if (responseSchemaName) {
    const success = Object.keys(responses).find((status) => /^2\d\d$/.test(status));
    if (success && !responses[success].content) {
      responses[success].content = {
        "application/json": {
          schema: { $ref: `#/components/schemas/${responseSchemaName}` },
        },
      };
    }
  }
  return responses;
}

function buildOpenApi(legacy, args) {
  const endpoints = collectEndpoints(legacy);
  const endpointSchemaNames = resolveEndpointSchemaNames(endpoints);
  const definitions = collectSchemaDefinitions(legacy, endpoints, endpointSchemaNames);
  definitions.set("ErrorResponse", null);
  const knownSchemas = new Set(definitions.keys());
  const schemas = {};
  for (const [name, definition] of definitions) {
    schemas[name] = name === "ErrorResponse"
      ? { $ref: "../../common/schemas/error-response.yaml" }
      : buildObjectSchema(definition, knownSchemas);
  }

  const paths = {};
  const allowedFeatureCodes = clean(args["permission-codes"])
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  for (const endpoint of endpoints) {
    const method = clean(endpoint.Method).toLowerCase();
    const legacyApiPath = clean(endpoint.Path);
    const fixedQuery = splitFixedQuery(legacyApiPath);
    const apiPath = fixedQuery.path;
    const summary = summaryFromTitle(endpoint.Title, legacyApiPath);
    const authorization = authorizationFromEndpoint(endpoint, args["feature-code"], allowedFeatureCodes);
    const operation = {
      tags: [args.tag],
      operationId: featureOperationId(method, apiPath, args["operation-id-prefix"]),
      summary,
      description: clean(endpoint.Overview) || summary,
      security: [{ BearerAuth: [] }],
      "x-authorization-mode": authorization.mode,
      "x-word-status-order": normalizeRows(endpoint.StatusRows, 3).map((row) => clean(row[0])),
    };
    if (authorization.featureCode) {
      operation["x-feature-code"] = authorization.featureCode;
    }
    if (authorization.featureCodes) {
      operation["x-feature-codes"] = authorization.featureCodes;
    }
    if (legacyApiPath !== apiPath) {
      operation["x-legacy-path"] = legacyApiPath;
    }
    const parameters = buildParameters(endpoint, knownSchemas);
    for (const parameter of fixedQuery.parameters) {
      if (!parameters.some((item) => item.name === parameter.name && item.in === parameter.in)) {
        parameters.push(parameter);
      }
    }
    const formDataRequestBody = buildFormDataRequestBody(endpoint, knownSchemas);
    if (parameters.length > 0) {
      operation.parameters = parameters;
      if (endpoint.ParametersTitle) {
        operation["x-word-parameters-title"] = clean(endpoint.ParametersTitle);
      }
    }
    if (formDataRequestBody) {
      operation.requestBody = formDataRequestBody;
      operation["x-word-hide-request-body"] = true;
      operation["x-word-parameters-title"] = clean(endpoint.ParametersTitle) || "リクエストパラメータ";
      operation["x-word-parameters"] = normalizeRows(endpoint.ParametersRows, 5)
        .map((row) => row.map(clean));
    }
    else if (parameters.length === 0 && normalizeRows(endpoint.ParametersRows, 5).length > 0) {
      operation["x-word-parameters-title"] = clean(endpoint.ParametersTitle) || "リクエストパラメータ";
      operation["x-word-parameters"] = normalizeRows(endpoint.ParametersRows, 5)
        .map((row) => row.map(clean));
    }
    let requestSchemaName = null;
    if (hasSemanticRequestBody(endpoint)) {
      if (formDataRequestBody) {
        throw new Error(`${method.toUpperCase()} ${apiPath}: both formData parameters and RequestRows are defined`);
      }
      requestSchemaName = endpointSchemaNames.requestNames.get(endpoint);
      operation.requestBody = {
        required: true,
        content: {
          [requestMediaType(endpoint.RequestTitle)]: {
            schema: { $ref: `#/components/schemas/${requestSchemaName}` },
          },
        },
      };
      operation["x-word-request-title"] = clean(endpoint.RequestTitle) || "リクエストボディ";
      operation["x-word-request-subtable-titles"] = (endpoint.RequestSubtables ?? [])
        .map((table) => clean(table.Title));
      operation["x-word-request-subtables"] = buildWordSubtables(endpoint.RequestSubtables);
    }
    else if (normalizeRows(endpoint.RequestRows, 4).length > 0) {
      operation["x-word-request-title"] = clean(endpoint.RequestTitle) || "リクエストボディ";
      operation["x-word-request-rows"] = normalizeRows(endpoint.RequestRows, 4)
        .map((row) => row.map(clean));
    }
    const successRow = normalizeRows(endpoint.StatusRows, 3).find((row) => /^2\d\d$/.test(clean(row[0])));
    const legacyResponseSchemaName = normalizeRows(endpoint.ResponseRows, 4).length > 0
      ? schemaNameFromTitle(endpoint.ResponseTitle, clean(successRow?.[2]))
      : null;
    const responseSchemaName = normalizeRows(endpoint.ResponseRows, 4).length > 0
      ? endpointSchemaNames.responseNames.get(endpoint)
      : null;
    operation.responses = buildResponses(endpoint, responseSchemaName, legacyResponseSchemaName, knownSchemas);
    const responseSchemaLabels = Object.fromEntries(
      normalizeRows(endpoint.StatusRows, 3)
        .map((row) => row.map(clean))
        .filter(([status, , schemaName]) => (
          (responseSchemaName && responseSchemaName !== legacyResponseSchemaName && schemaName === legacyResponseSchemaName)
          || isBinaryResponse(endpoint, schemaName)
          || (!/^2\d\d$/.test(status) && schemaName !== "-" && !knownSchemas.has(schemaName))
        ))
        .map(([status, , schemaName]) => [status, schemaName]),
    );
    if (Object.keys(responseSchemaLabels).length > 0) {
      operation["x-word-response-schema-labels"] = responseSchemaLabels;
    }
    if (endpoint.ResponseTitle) {
      operation["x-word-response-title"] = clean(endpoint.ResponseTitle);
    }
    if (normalizeRows(endpoint.ResponseRows, 4).length > 0) {
      operation["x-word-response-subtable-titles"] = (endpoint.ResponseSubtables ?? [])
        .map((table) => clean(table.Title));
      if (successRow && isBinaryResponse(endpoint, clean(successRow[2]))) {
        operation["x-word-response-rows"] = normalizeRows(endpoint.ResponseRows, 4)
          .map((row) => row.map(clean));
      }
    }
    if ((endpoint.ResponseSubtables ?? []).length > 0) {
      operation["x-word-response-subtables"] = buildWordSubtables(endpoint.ResponseSubtables);
    }
    if ((endpoint.ResponseLines ?? []).length > 0) {
      operation["x-word-response-lines"] = endpoint.ResponseLines.map(clean);
    }
    paths[apiPath] ??= {};
    paths[apiPath][method] = operation;
  }

  return {
    openapi: "3.0.4",
    info: {
      title: `${args.title} API`,
      version: args.version,
      description: clean(legacy.ScreenLabel)
        ? `${clean(legacy.ScreenLabel)}で利用するAPI群。`
        : `${args.title}で利用するAPI群。`,
    },
    servers: [{ url: "/api" }],
    tags: [{ name: args.tag, description: `${args.title}のAPI` }],
    paths,
    components: {
      securitySchemes: {
        BearerAuth: { $ref: "../../common/security/bearer-auth.yaml" },
      },
      schemas,
    },
  };
}

try {
  const args = parseArgs(process.argv.slice(2));
  const legacy = readJson(args.legacy);
  const openapi = buildOpenApi(legacy, args);
  const outputPath = path.resolve(args.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, dumpYaml(openapi, {
    noRefs: true,
    lineWidth: 120,
    noCompatMode: true,
    quotingType: '"',
    forceQuotes: false,
  }), "utf8");
  console.log(outputPath);
}
catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
