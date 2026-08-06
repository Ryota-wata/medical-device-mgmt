import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^--/, "");
    const value = argv[index + 1];
    if (!key || !value) {
      throw new Error("Usage: node compare-api-migration-parity.mjs --legacy <legacy.json> --model <word-model.json>");
    }
    args[key] = value;
  }
  if (!args.legacy || !args.model) {
    throw new Error("Both --legacy and --model are required");
  }
  args.mode ??= "strict";
  if (!["strict", "contract"].includes(args.mode)) {
    throw new Error("--mode must be strict or contract");
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8").replace(/^\uFEFF/, ""));
}

function normalizeRows(value, columnCount) {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`Expected table rows to be an array, received ${typeof value}`);
  }
  if (value.length === 0) {
    return [];
  }
  const flattened = value.flatMap((row) => {
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

function clean(value) {
  return String(value ?? "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function endpointMap(spec) {
  const result = new Map();
  for (const section of spec.Sections ?? []) {
    if (section.Type !== "EndpointBlocks") {
      continue;
    }
    for (const endpoint of section.Items ?? []) {
      const normalized = normalizeFixedQueryEndpoint(endpoint);
      result.set(`${normalized.Method.toUpperCase()} ${normalized.Path}`, normalized);
    }
  }
  return result;
}

function normalizeFixedQueryEndpoint(endpoint) {
  const apiPath = clean(endpoint.Path);
  const queryIndex = apiPath.indexOf("?");
  if (queryIndex < 0) {
    return endpoint;
  }
  const parameters = normalizeRows(endpoint.ParametersRows, endpoint.ParametersHeaders?.length ?? 5);
  for (const pair of apiPath.slice(queryIndex + 1).split("&")) {
    if (!pair) continue;
    const [rawName, rawValue = ""] = pair.split("=", 2);
    parameters.push([
      decodeURIComponent(rawName),
      "query",
      "string",
      "✓",
      `固定値: ${decodeURIComponent(rawValue)}`,
    ]);
  }
  return {
    ...endpoint,
    Path: apiPath.slice(0, queryIndex),
    ParametersHeaders: endpoint.ParametersHeaders ?? ["パラメータ", "In", "型", "必須", "説明"],
    ParametersRows: parameters,
  };
}

function compareSet(errors, key, label, expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  for (const value of expectedSet) {
    if (!actualSet.has(value)) {
      errors.push(`${key}: ${label} missing '${value}'`);
    }
  }
  for (const value of actualSet) {
    if (!expectedSet.has(value)) {
      errors.push(`${key}: ${label} added '${value}' without legacy counterpart`);
    }
  }
}

function compareContains(errors, key, label, expected, actual) {
  const actualSet = new Set(actual);
  for (const value of new Set(expected)) {
    if (!actualSet.has(value)) {
      errors.push(`${key}: ${label} missing '${value}'`);
    }
  }
}

function fieldSignatures(rows, headers, kind) {
  const columnCount = headers?.length ?? (kind === "parameters" ? 5 : 4);
  return normalizeRows(rows, columnCount).filter((row) => clean(row[0]) !== "-").map((row) => {
    if (kind === "parameters") {
      return `${clean(row[0])}|${clean(row[1])}|${clean(row[3])}`;
    }
    return `${clean(row[0])}|${clean(row[2])}`;
  });
}

function normalizeStatusSchema(value) {
  const schema = clean(value);
  return /^(?:binary|file)$|binary|バイナリ/i.test(schema) ? "binary" : schema;
}

function statusSignatures(rows) {
  return normalizeRows(rows, 3).map((row) => `${clean(row[0])}|${normalizeStatusSchema(row[2])}`);
}

function lineSignatures(lines) {
  return (lines ?? []).map(clean).filter(Boolean);
}

function compareSubtables(errors, key, label, legacySubtables, generatedSubtables) {
  const toMap = (subtables) => new Map((subtables ?? []).map((table) => [
    clean(table.Title),
    fieldSignatures(table.Rows, table.Headers, "fields"),
  ]));
  const expected = toMap(legacySubtables);
  const actual = toMap(generatedSubtables);
  compareSet(errors, key, `${label} subtables`, [...expected.keys()], [...actual.keys()]);
  for (const [title, expectedFields] of expected) {
    if (actual.has(title)) {
      compareSet(errors, key, `${label} subtable '${title}' fields`, expectedFields, actual.get(title));
    }
  }
}

function compareExtraSections(errors, key, legacySections, generatedSections) {
  const toMap = (sections) => new Map((sections ?? []).map((section) => [
    clean(section.Title),
    lineSignatures(section.Lines),
  ]));
  const expected = toMap(legacySections);
  const actual = toMap(generatedSections);
  compareSet(errors, key, "extra sections", [...expected.keys()], [...actual.keys()]);
  for (const [title, expectedLines] of expected) {
    if (actual.has(title)) {
      compareSet(errors, key, `extra section '${title}' lines`, expectedLines, actual.get(title));
    }
  }
}

function compareExtraTables(errors, key, legacyTables, generatedTables) {
  const toMap = (tables) => new Map((tables ?? []).map((table) => [
    clean(table.Title),
    normalizeRows(table.Rows, table.Headers?.length ?? 0)
      .map((row) => row.map(clean).join("|")),
  ]));
  const expected = toMap(legacyTables);
  const actual = toMap(generatedTables);
  compareSet(errors, key, "extra tables", [...expected.keys()], [...actual.keys()]);
  for (const [title, expectedRows] of expected) {
    if (actual.has(title)) {
      compareSet(errors, key, `extra table '${title}' rows`, expectedRows, actual.get(title));
    }
  }
}

function compareEndpoint(errors, key, legacy, generated, mode) {
  if (mode === "strict") {
    for (const field of ["ParametersTitle", "RequestTitle", "ResponseTitle"]) {
      const legacyValue = clean(legacy[field]);
      const generatedValue = clean(generated[field]);
      if (legacyValue !== generatedValue) {
        errors.push(`${key}: ${field} differs: legacy='${legacyValue}' generated='${generatedValue}'`);
      }
    }
  }
  compareSet(
    errors,
    key,
    "parameters",
    fieldSignatures(legacy.ParametersRows, legacy.ParametersHeaders, "parameters"),
    fieldSignatures(generated.ParametersRows, generated.ParametersHeaders, "parameters"),
  );
  compareSet(
    errors,
    key,
    "request fields",
    fieldSignatures(legacy.RequestRows, legacy.RequestHeaders, "fields"),
    fieldSignatures(generated.RequestRows, generated.RequestHeaders, "fields"),
  );
  compareSet(
    errors,
    key,
    "response fields",
    fieldSignatures(legacy.ResponseRows, legacy.ResponseHeaders, "fields"),
    fieldSignatures(generated.ResponseRows, generated.ResponseHeaders, "fields"),
  );
  compareSubtables(errors, key, "request", legacy.RequestSubtables, generated.RequestSubtables);
  compareSubtables(errors, key, "response", legacy.ResponseSubtables, generated.ResponseSubtables);
  compareSet(errors, key, "HTTP statuses", statusSignatures(legacy.StatusRows), statusSignatures(generated.StatusRows));
  if (mode === "strict") {
    compareContains(errors, key, "permission rules", lineSignatures(legacy.PermissionLines), lineSignatures(generated.PermissionLines));
    compareContains(errors, key, "processing rules", lineSignatures(legacy.ProcessingLines), lineSignatures(generated.ProcessingLines));
    compareExtraSections(errors, key, legacy.ExtraSections, generated.ExtraSections);
    compareExtraTables(errors, key, legacy.ExtraTables, generated.ExtraTables);
  }
}

try {
  const args = parseArgs(process.argv.slice(2));
  const legacy = readJson(args.legacy);
  const generated = readJson(args.model);
  const legacyEndpoints = endpointMap(legacy);
  const generatedEndpoints = endpointMap(generated);
  const errors = [];

  compareSet(errors, "document", "endpoints", [...legacyEndpoints.keys()], [...generatedEndpoints.keys()]);
  for (const [key, legacyEndpoint] of legacyEndpoints) {
    const generatedEndpoint = generatedEndpoints.get(key);
    if (generatedEndpoint) {
      compareEndpoint(errors, key, legacyEndpoint, generatedEndpoint, args.mode);
    }
  }

  if (errors.length > 0) {
    console.error(`API migration parity failed (${errors.length} issue(s)):`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`API migration parity verified (${args.mode}): ${legacyEndpoints.size} endpoints.`);
}
catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
