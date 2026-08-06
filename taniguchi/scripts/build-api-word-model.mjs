import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { load as loadYaml } from "js-yaml";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      throw new Error(`Unexpected argument: ${value}`);
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    args[key] = next;
    index += 1;
  }
  if (!args.manifest || !args.output) {
    throw new Error("Usage: node build-api-word-model.mjs --manifest <feature.yaml> --output <model.json>");
  }
  return args;
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
}

const yamlCache = new Map();

function readYaml(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!yamlCache.has(absolutePath)) {
    yamlCache.set(absolutePath, loadYaml(readText(absolutePath)));
  }
  return yamlCache.get(absolutePath);
}

function resolveRelative(ownerPath, relativePath) {
  return path.resolve(path.dirname(ownerPath), relativePath);
}

function jsonPointer(value, pointer) {
  if (!pointer || pointer === "#") {
    return value;
  }
  return pointer
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((current, part) => current?.[part], value);
}

function resolveRef(ref, ownerPath, stack = []) {
  const [filePart, fragment = ""] = ref.split("#", 2);
  const targetPath = filePart ? resolveRelative(ownerPath, filePart) : ownerPath;
  const key = `${targetPath}#${fragment}`;
  if (stack.includes(key)) {
    throw new Error(`Circular $ref detected: ${[...stack, key].join(" -> ")}`);
  }
  const target = jsonPointer(readYaml(targetPath), fragment ? `#${fragment}` : "#");
  if (target === undefined) {
    throw new Error(`Unresolved $ref '${ref}' in ${ownerPath}`);
  }
  return resolveValue(target, targetPath, [...stack, key]);
}

function resolveValue(value, ownerPath, stack = []) {
  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, ownerPath, stack));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  if (typeof value.$ref === "string") {
    const resolved = resolveRef(value.$ref, ownerPath, stack);
    const siblings = Object.fromEntries(Object.entries(value).filter(([key]) => key !== "$ref"));
    const refName = value.$ref.split("/").at(-1).split("#").at(-1);
    return { ...resolved, ...resolveValue(siblings, ownerPath, stack), __refName: refName };
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, resolveValue(child, ownerPath, stack)]),
  );
}

function normalizeSchema(schema, ownerPath) {
  const resolved = resolveValue(schema ?? {}, ownerPath);
  if (!Array.isArray(resolved.allOf)) {
    return resolved;
  }
  const merged = { ...resolved };
  delete merged.allOf;
  merged.properties = { ...(merged.properties ?? {}) };
  merged.required = [...(merged.required ?? [])];
  for (const part of resolved.allOf) {
    const normalizedPart = normalizeSchema(part, ownerPath);
    const accumulatedProperties = merged.properties;
    const accumulatedRequired = merged.required;
    Object.assign(merged, normalizedPart);
    merged.properties = { ...accumulatedProperties, ...(normalizedPart.properties ?? {}) };
    merged.required = [...new Set([...accumulatedRequired, ...(normalizedPart.required ?? [])])];
  }
  if (!merged.type && Object.keys(merged.properties).length > 0) {
    merged.type = "object";
  }
  return merged;
}

function schemaName(schema, fallback = "Object") {
  if (schema?.__refName) {
    return schema.__refName;
  }
  if (schema?.$ref) {
    return schema.$ref.split("/").at(-1).split("#").at(-1) || fallback;
  }
  if (schema?.type === "array") {
    return `${schemaName(schema.items, "Object")}[]`;
  }
  if (schema?.type === "string" && schema?.format) {
    if (schema.format === "date") {
      return "string(date)";
    }
    if (schema.format === "date-time") {
      return "string(datetime)";
    }
    if (schema.format === "uuid") {
      return "string(uuid)";
    }
    if (schema.format === "binary") {
      return "binary";
    }
    return "string";
  }
  if (schema?.format) {
    return schema.format;
  }
  return schema?.type ?? fallback;
}

function constraintText(schema) {
  const constraints = [];
  if (schema.minLength !== undefined && schema.maxLength !== undefined) {
    constraints.push(`${schema.minLength}～${schema.maxLength}文字`);
  }
  else if (schema.minLength !== undefined) {
    constraints.push(`${schema.minLength}文字以上`);
  }
  else if (schema.maxLength !== undefined) {
    constraints.push(`${schema.maxLength}文字以下`);
  }
  if (schema.minimum !== undefined) {
    constraints.push(`${schema.minimum}以上`);
  }
  if (schema.maximum !== undefined) {
    constraints.push(`${schema.maximum}以下`);
  }
  if (Array.isArray(schema.enum)) {
    constraints.push(`許容値: ${schema.enum.join(", ")}`);
  }
  if (schema.pattern) {
    constraints.push(`形式: ${schema.pattern}`);
  }
  return constraints.join("、");
}

function descriptionWithConstraints(schema) {
  const constraint = constraintText(schema);
  return [schema.description, constraint].filter(Boolean).join("。") || "-";
}

function cleanMarkdownInline(value) {
  return String(value)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function schemaTable(schema, ownerPath) {
  const normalized = normalizeSchema(schema, ownerPath);
  const required = new Set(normalized.required ?? []);
  const rows = [];
  const subtables = [];

  for (const [name, rawProperty] of Object.entries(normalized.properties ?? {})) {
    const property = normalizeSchema(rawProperty, ownerPath);
    if (!property["x-word-omit-row"]) {
      rows.push([
        name,
        schemaName(rawProperty, property.type ?? "object"),
        property["x-word-required-label"] ?? (required.has(name) ? "✓" : "-"),
        descriptionWithConstraints(property),
      ]);
    }

    const nestedRaw = property.type === "array" ? rawProperty.items : rawProperty;
    const nested = property.type === "array"
      ? normalizeSchema(property.items, ownerPath)
      : property;
    if (!property["x-word-omit-subtable"] && (nested?.type === "object" || nested?.properties)) {
      const nestedTable = schemaTable(nestedRaw, ownerPath);
      subtables.push({
        Title: property["x-word-subtable-title"]
          ?? `${name}要素（${schemaName(nestedRaw, "Object").replace(/\[\]$/, "")}）`,
        Headers: ["フィールド", "型", "必須", "説明"],
        Rows: nestedTable.rows,
      });
      subtables.push(...nestedTable.subtables);
    }
  }
  return { rows, subtables };
}

function selectWordSubtables(subtables, configuredTitles) {
  if (!Array.isArray(configuredTitles)) {
    return subtables;
  }
  const byTitle = new Map(subtables.map((table) => [table.Title, table]));
  return configuredTitles
    .map((title) => byTitle.get(title))
    .filter(Boolean);
}

function explicitWordSubtables(configuredSubtables) {
  if (!Array.isArray(configuredSubtables)) {
    return null;
  }
  return configuredSubtables.map((table) => ({
    Title: String(table.Title ?? table.title ?? ""),
    Headers: [...(table.Headers ?? table.headers ?? [])].map((value) => String(value ?? "")),
    Rows: [...(table.Rows ?? table.rows ?? [])].map((row) =>
      [...row].map((value) => String(value ?? "")),
    ),
  }));
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cleanMarkdownInline(cell.trim().replace(/\\\|/g, "|")));
}

function isTableSeparator(line) {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);
}

function parseDesign(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  const operationNotes = new Map();
  const operationTables = new Map();
  let inEndpointChapter = false;
  let operationId = null;
  let subsection = null;

  function addOperationLine(text) {
    if (!operationId || !subsection || !text) {
      return;
    }
    if (!operationNotes.has(operationId)) {
      operationNotes.set(operationId, new Map());
    }
    const notes = operationNotes.get(operationId);
    if (!notes.has(subsection)) {
      notes.set(subsection, []);
    }
    notes.get(subsection).push(cleanMarkdownInline(text));
  }

  function addOperationTable(title, headers, rows) {
    if (!operationId || !title) {
      return;
    }
    if (!operationTables.has(operationId)) {
      operationTables.set(operationId, []);
    }
    operationTables.get(operationId).push({
      Title: cleanMarkdownInline(title),
      Headers: headers,
      Rows: rows,
    });
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      continue;
    }
    if (/^#\s+/.test(line)) {
      continue;
    }
    if (/^##\s+/.test(line)) {
      const title = line.replace(/^##\s+/, "");
      inEndpointChapter = false;
      operationId = null;
      subsection = null;
      sections.push({ Type: "Heading1", Text: cleanMarkdownInline(title) });
      continue;
    }
    if (!inEndpointChapter && /^###\s+[A-Za-z][A-Za-z0-9]*\s*$/.test(line)) {
      const nextContentLine = lines.slice(index + 1).find((candidate) => candidate.trim());
      if (/^####\s+権限\s*$/.test(nextContentLine?.trim() ?? "")) {
        inEndpointChapter = true;
        sections.push({ Type: "__ENDPOINTS__" });
      }
    }
    if (inEndpointChapter && /^###\s+/.test(line)) {
      operationId = line.replace(/^###\s+/, "").split(/\s+[—–-]\s+/, 1)[0].trim();
      subsection = null;
      if (!operationNotes.has(operationId)) {
        operationNotes.set(operationId, new Map());
      }
      continue;
    }
    if (inEndpointChapter && /^####\s+/.test(line)) {
      subsection = line.replace(/^####\s+/, "");
      continue;
    }
    if (inEndpointChapter) {
      if (line.includes("|") && isTableSeparator(lines[index + 1] ?? "")) {
        const headers = splitTableRow(line);
        const rows = [];
        index += 2;
        while (index < lines.length && lines[index].trim().includes("|")) {
          rows.push(splitTableRow(lines[index]));
          index += 1;
        }
        index -= 1;
        addOperationTable(subsection, headers, rows);
        continue;
      }
      if (/^[-*]\s+/.test(line)) {
        addOperationLine(line.replace(/^[-*]\s+/, ""));
      }
      else if (/^\d+\.\s+/.test(line)) {
        addOperationLine(line.replace(/^\d+\.\s+/, ""));
      }
      else {
        addOperationLine(line);
      }
      continue;
    }
    if (/^###\s+/.test(line)) {
      sections.push({ Type: "Heading2", Text: cleanMarkdownInline(line.replace(/^###\s+/, "")) });
      continue;
    }
    if (/^####\s+/.test(line)) {
      sections.push({ Type: "Heading3", Text: cleanMarkdownInline(line.replace(/^####\s+/, "")) });
      continue;
    }
    if (line.includes("|") && isTableSeparator(lines[index + 1] ?? "")) {
      const headers = splitTableRow(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].trim().includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      index -= 1;
      sections.push({ Type: "Table", Headers: headers, Rows: rows });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = [cleanMarkdownInline(line.replace(/^[-*]\s+/, ""))];
      while (/^\s*[-*]\s+/.test(lines[index + 1] ?? "")) {
        index += 1;
        items.push(cleanMarkdownInline(lines[index].trim().replace(/^[-*]\s+/, "")));
      }
      sections.push({ Type: "Bullets", Items: items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [cleanMarkdownInline(line.replace(/^\d+\.\s+/, ""))];
      while (/^\s*\d+\.\s+/.test(lines[index + 1] ?? "")) {
        index += 1;
        items.push(cleanMarkdownInline(lines[index].trim().replace(/^\d+\.\s+/, "")));
      }
      sections.push({ Type: "Numbered", Items: items });
      continue;
    }

    const paragraph = [line];
    while (index + 1 < lines.length) {
      const next = lines[index + 1].trim();
      if (!next || /^#{1,4}\s+/.test(next) || /^[-*]\s+/.test(next) || /^\d+\.\s+/.test(next)) {
        break;
      }
      if (next.includes("|") && isTableSeparator(lines[index + 2] ?? "")) {
        break;
      }
      index += 1;
      paragraph.push(next);
    }
    sections.push({ Type: "Paragraph", Text: cleanMarkdownInline(paragraph.join(" ")) });
  }
  return { sections, operationNotes, operationTables };
}

function firstContentSchema(content) {
  if (!content || typeof content !== "object") {
    return null;
  }
  return content["application/json"]?.schema
    ?? Object.values(content).find((entry) => entry?.schema)?.schema
    ?? null;
}

function responseSchema(response, ownerPath) {
  const resolved = resolveValue(response, ownerPath);
  return firstContentSchema(resolved.content);
}

function securityText(security) {
  if (!Array.isArray(security) || security.length === 0) {
    return "不要";
  }
  const alternatives = security.map((requirement) =>
    Object.keys(requirement)
      .map((scheme) => {
        if (scheme === "BearerAuth") {
          return "Bearer";
        }
        if (scheme === "RememberTokenCookie") {
          return "remember token cookie";
        }
        return scheme;
      })
      .join("＋"),
  );
  return `要（${alternatives.join(" または ")}）`;
}

function buildEndpoint(operation, method, apiPath, pathItem, openapiPath, notes, tables, globalSecurity) {
  const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])].map((parameter) =>
    resolveValue(parameter, openapiPath),
  );
  const endpoint = {
    Title: `${operation.summary}（${apiPath}）`,
    Overview: operation.description ?? operation.summary,
    Method: method.toUpperCase(),
    Path: apiPath,
    Auth: securityText(operation.security ?? pathItem.security ?? globalSecurity),
  };

  if (Array.isArray(operation["x-word-parameters"])) {
    endpoint.ParametersTitle = operation["x-word-parameters-title"] ?? "リクエストパラメータ";
    endpoint.ParametersHeaders = ["パラメータ", "In", "型", "必須", "説明"];
    endpoint.ParametersRows = operation["x-word-parameters"];
  }
  else if (parameters.length > 0) {
    endpoint.ParametersTitle = operation["x-word-parameters-title"] ?? "リクエストパラメータ";
    endpoint.ParametersHeaders = ["パラメータ", "In", "型", "必須", "説明"];
    endpoint.ParametersRows = parameters.map((parameter) => {
      const schema = normalizeSchema(parameter.schema, openapiPath);
      return [
        parameter.name,
        parameter.in,
        schemaName(parameter.schema, schema.type),
        parameter["x-word-required-label"] ?? (parameter.required ? "✓" : "-"),
        descriptionWithConstraints({ ...schema, description: parameter.description ?? schema.description }),
      ];
    });
  }

  const requestBody = operation.requestBody ? resolveValue(operation.requestBody, openapiPath) : null;
  const requestSchema = firstContentSchema(requestBody?.content);
  if (Array.isArray(operation["x-word-request-rows"])) {
    endpoint.RequestTitle = operation["x-word-request-title"] ?? "リクエストボディ";
    endpoint.RequestHeaders = ["フィールド", "型", "必須", "説明"];
    endpoint.RequestRows = operation["x-word-request-rows"];
  }
  else if (requestSchema && !operation["x-word-hide-request-body"]) {
    const table = schemaTable(requestSchema, openapiPath);
    const subtables = explicitWordSubtables(operation["x-word-request-subtables"])
      ?? selectWordSubtables(
        table.subtables,
        operation["x-word-request-subtable-titles"],
      );
    endpoint.RequestTitle = operation["x-word-request-title"] ?? "リクエストボディ";
    endpoint.RequestHeaders = ["フィールド", "型", "必須", "説明"];
    endpoint.RequestRows = table.rows;
    if (subtables.length > 0) {
      endpoint.RequestSubtables = subtables;
    }
  }

  const permissionLines = notes?.get("権限") ?? [];
  const processingLines = notes?.get("処理仕様") ?? [];
  if (permissionLines.length > 0) {
    endpoint.PermissionLines = permissionLines;
  }
  if (processingLines.length > 0) {
    endpoint.ProcessingLines = processingLines;
  }
  const extraSections = [...(notes?.entries() ?? [])]
    .filter(([title]) => !["権限", "処理仕様"].includes(title))
    .map(([title, lines]) => ({ Title: title, Lines: lines }));
  if (extraSections.length > 0) {
    endpoint.ExtraSections = extraSections;
  }
  if (tables?.length > 0) {
    endpoint.ExtraTables = tables;
  }

  const responseOrder = operation["x-word-status-order"] ?? [];
  const responseEntries = Object.entries(operation.responses ?? {}).sort(([left], [right]) => {
    const leftIndex = responseOrder.indexOf(left);
    const rightIndex = responseOrder.indexOf(right);
    if (leftIndex < 0 && rightIndex < 0) return 0;
    if (leftIndex < 0) return 1;
    if (rightIndex < 0) return -1;
    return leftIndex - rightIndex;
  });
  const successEntry = responseEntries.find(([status]) => /^2\d\d$/.test(status));
  if (!successEntry) {
    throw new Error(`${operation.operationId}: successful response is missing`);
  }
  const [successStatus, successResponseRaw] = successEntry;
  const successResponse = resolveValue(successResponseRaw, openapiPath);
  const successSchema = responseSchema(successResponseRaw, openapiPath);
  if (successSchema) {
    const name = schemaName(successSchema, "Response");
    const table = schemaTable(successSchema, openapiPath);
    const responseRows = Array.isArray(operation["x-word-response-rows"])
      ? operation["x-word-response-rows"]
      : table.rows;
    const subtables = explicitWordSubtables(operation["x-word-response-subtables"])
      ?? selectWordSubtables(
        table.subtables,
        operation["x-word-response-subtable-titles"],
      );
    endpoint.ResponseTitle = operation["x-word-response-title"] ?? `レスポンス（${successStatus}：${name}）`;
    if (responseRows.length > 0) {
      endpoint.ResponseHeaders = ["フィールド", "型", "必須", "説明"];
      endpoint.ResponseRows = responseRows;
    }
    if (subtables.length > 0) {
      endpoint.ResponseSubtables = subtables;
    }
    if (Array.isArray(operation["x-word-response-lines"]) && operation["x-word-response-lines"].length > 0) {
      endpoint.ResponseLines = operation["x-word-response-lines"];
    }
    else if (responseRows.length === 0 && subtables.length === 0) {
      endpoint.ResponseLines = [successResponse.description ?? "Bodyは返却しない。"]; 
    }
  }
  else {
    endpoint.ResponseTitle = operation["x-word-response-title"] ?? `レスポンス（${successStatus}：No Content）`;
    const subtables = explicitWordSubtables(operation["x-word-response-subtables"]) ?? [];
    if (subtables.length > 0) {
      endpoint.ResponseSubtables = subtables;
    }
    endpoint.ResponseLines = Array.isArray(operation["x-word-response-lines"]) && operation["x-word-response-lines"].length > 0
      ? operation["x-word-response-lines"]
      : [successResponse.description ?? "Bodyは返却しない。"]; 
  }

  const responseSchemaLabels = operation["x-word-response-schema-labels"] ?? {};
  endpoint.StatusRows = responseEntries.map(([status, responseRaw]) => {
    const response = resolveValue(responseRaw, openapiPath);
    const schema = responseSchema(responseRaw, openapiPath);
    return [
      status,
      response.description ?? "-",
      responseSchemaLabels[status] ?? (schema ? schemaName(schema, "ErrorResponse") : "-"),
    ];
  });
  return endpoint;
}

function buildModel(manifestPath) {
  const manifest = readYaml(manifestPath);
  if (manifest.authoringMode !== "openapi") {
    throw new Error(`authoringMode must be 'openapi': ${manifestPath}`);
  }
  const openapiPath = resolveRelative(manifestPath, manifest.sources.openapi);
  const designPath = resolveRelative(manifestPath, manifest.sources.design);
  const openapi = readYaml(openapiPath);
  const { sections, operationNotes, operationTables } = parseDesign(readText(designPath));
  const endpoints = [];

  for (const [apiPath, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }
      if (!operation.operationId) {
        throw new Error(`${method.toUpperCase()} ${apiPath}: operationId is missing`);
      }
      const notes = operationNotes.get(operation.operationId);
      if (!notes) {
        throw new Error(`${operation.operationId}: matching design.md heading is missing`);
      }
      endpoints.push(buildEndpoint(
        operation,
        method,
        apiPath,
        pathItem,
        openapiPath,
        notes,
        operationTables.get(operation.operationId),
        openapi.security,
      ));
    }
  }
  const operationIds = new Set(endpoints.map((endpoint) => endpoint.Title));
  if (operationIds.size !== endpoints.length) {
    throw new Error("Duplicate endpoint titles detected");
  }
  for (const designOperationId of operationNotes.keys()) {
    const exists = Object.values(openapi.paths ?? {}).some((pathItem) =>
      HTTP_METHODS.some((method) => pathItem[method]?.operationId === designOperationId),
    );
    if (!exists) {
      throw new Error(`${designOperationId}: design.md operation has no OpenAPI operation`);
    }
  }

  return {
    TemplatePath: resolveRelative(manifestPath, manifest.deliverable.template),
    OutputPath: resolveRelative(manifestPath, manifest.deliverable.word),
    ScreenLabel: manifest.title,
    CoverDateText: manifest.deliverable.coverDate,
    CoverVersionText: manifest.deliverable.version,
    RevisionVersionText: manifest.deliverable.version,
    RevisionDateText: manifest.deliverable.revisionDate,
    RevisionSummaryText: manifest.deliverable.revisionSummary,
    RevisionAuthorText: manifest.deliverable.revisionAuthor,
    Sections: sections.map((section) =>
      section.Type === "__ENDPOINTS__" ? { Type: "EndpointBlocks", Items: endpoints } : section,
    ),
  };
}

try {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(args.manifest);
  const outputPath = path.resolve(args.output);
  const model = buildModel(manifestPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(model, null, 2)}\n`, "utf8");
  console.log(outputPath);
}
catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
