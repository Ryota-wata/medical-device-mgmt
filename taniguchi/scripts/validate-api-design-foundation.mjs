import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv from "ajv";
import SwaggerParser from "@apidevtools/swagger-parser";
import { load as loadYaml } from "js-yaml";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const taniguchiDir = path.resolve(scriptDir, "..");
const apiDir = path.join(taniguchiDir, "api");

const catalogPath = path.join(apiDir, "catalog.yaml");
const catalogSchemaPath = path.join(apiDir, "catalog.schema.json");
const featureSchemaPath = path.join(apiDir, "feature.schema.json");
const apiIndexPath = path.join(apiDir, "API設計書_一覧.md");
const featureRoot = path.join(apiDir, "features");

const errors = [];
const globalOperationOwners = new Map();
const httpMethods = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
]);
const authorizationModes = new Set([
  "public",
  "authenticated",
  "feature-code",
  "feature-code-all",
  "system-admin",
  "dynamic",
  "system-fixed",
]);

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function readYaml(filePath) {
  return loadYaml(readText(filePath));
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function report(message) {
  errors.push(message);
}

function validateUnique(items, key) {
  const seen = new Map();
  for (const item of items) {
    const value = item[key];
    if (seen.has(value)) {
      report(`catalog: duplicate ${key} '${value}' (${seen.get(value)}, ${item.id})`);
      continue;
    }
    seen.set(value, item.id);
  }
}

function resolveFromCatalog(relativePath) {
  return path.resolve(apiDir, relativePath);
}

function resolveFromManifest(manifestPath, relativePath) {
  return path.resolve(path.dirname(manifestPath), relativePath);
}

function reportMissingFile(label, filePath, basePath = taniguchiDir) {
  if (!fs.existsSync(filePath)) {
    report(`${label}: file does not exist '${toPosix(path.relative(basePath, filePath))}'`);
    return true;
  }
  return false;
}

function listFiles(directory, extension) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        !entry.name.startsWith("~$") &&
        entry.name.endsWith(extension),
    )
    .map((entry) => entry.name)
    .sort();
}

function parseIndexRows(markdown) {
  const rows = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!/^\|\s*[0-9]+[a-z]?\s*\|/.test(line)) {
      continue;
    }
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 6) {
      report(`API設計書_一覧.md: malformed table row '${line}'`);
      continue;
    }
    rows.push({
      legacyNo: cells[0],
      phase: Number(cells[1]),
      title: cells[2],
      status: cells[5].replaceAll("`", ""),
    });
  }
  return rows;
}

function collectExternalRefs(value, refs = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectExternalRefs(item, refs);
    }
    return refs;
  }
  if (!value || typeof value !== "object") {
    return refs;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "$ref" && typeof child === "string" && !child.startsWith("#")) {
      refs.push(child);
      continue;
    }
    collectExternalRefs(child, refs);
  }
  return refs;
}

function collectOperations(openapi, openapiPath) {
  const operations = [];
  for (const [apiPath, pathItem] of Object.entries(openapi.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method.toLowerCase())) {
        continue;
      }
      if (!operation || typeof operation !== "object") {
        report(`${toPosix(path.relative(taniguchiDir, openapiPath))}: ${method.toUpperCase()} ${apiPath} is not an operation object`);
        continue;
      }
      operations.push({ apiPath, method: method.toUpperCase(), operation });
    }
  }
  return operations;
}

function parseChapter5OperationIds(markdown) {
  const operationIds = [];
  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const h3 = line.match(/^###\s+([a-z][A-Za-z0-9]*)\s*$/);
    const nextContentLine = lines.slice(index + 1).find((candidate) => candidate.trim());
    if (h3 && /^####\s+権限\s*$/.test(nextContentLine?.trim() ?? "")) {
      operationIds.push(h3[1]);
    }
  }
  return operationIds;
}

function parsePumlEntities(puml) {
  const entities = new Set();
  for (const match of puml.matchAll(/\bentity\s+"([^"]+)"\s+as\s+([a-z][a-z0-9_]*)\s*\{/g)) {
    entities.add(match[1]);
    entities.add(match[2]);
  }
  for (const match of puml.matchAll(/\bentity\s+([a-z][a-z0-9_]*)\s*\{/g)) {
    entities.add(match[1]);
  }
  return entities;
}

async function validateOpenApiFeature({ manifest, openapiPath, designPath }) {
  const relativeOpenApiPath = toPosix(path.relative(taniguchiDir, openapiPath));
  let openapi;
  try {
    openapi = readYaml(openapiPath);
  } catch (error) {
    report(`${relativeOpenApiPath}: ${error.message}`);
    return;
  }

  try {
    await SwaggerParser.validate(openapiPath);
  } catch (error) {
    report(`${relativeOpenApiPath}: OpenAPI schema validation failed: ${error.message}`);
  }

  if (openapi.openapi !== catalog.defaults.openapiVersion) {
    report(`${relativeOpenApiPath}: OpenAPI version must be ${catalog.defaults.openapiVersion}`);
  }
  if (!openapi.paths || typeof openapi.paths !== "object") {
    report(`${relativeOpenApiPath}: paths is required`);
    return;
  }

  for (const ref of collectExternalRefs(openapi)) {
    const refPath = ref.split("#", 1)[0];
    if (!refPath || /^https?:\/\//.test(refPath)) {
      continue;
    }
    if (!fs.existsSync(path.resolve(path.dirname(openapiPath), refPath))) {
      report(`${relativeOpenApiPath}: unresolved $ref '${ref}'`);
    }
  }

  const operations = collectOperations(openapi, openapiPath);
  if (operations.length === 0) {
    report(`${relativeOpenApiPath}: at least one operation is required`);
  }

  const seenOperationIds = new Set();
  const openapiOperationIds = [];
  const permissionCodes = new Set(manifest.permissionCodes ?? []);
  const globalSecurity = openapi.security;
  for (const { apiPath, method, operation } of operations) {
    const location = `${relativeOpenApiPath}: ${method} ${apiPath}`;
    const operationId = operation.operationId;
    if (typeof operationId !== "string" || !/^[a-z][A-Za-z0-9]*$/.test(operationId)) {
      report(`${location}: operationId must be lowerCamelCase`);
    } else if (seenOperationIds.has(operationId)) {
      report(`${location}: duplicate operationId '${operationId}'`);
    } else {
      seenOperationIds.add(operationId);
      openapiOperationIds.push(operationId);
      if (globalOperationOwners.has(operationId)) {
        report(`${location}: operationId '${operationId}' is already used by ${globalOperationOwners.get(operationId)}`);
      } else {
        globalOperationOwners.set(operationId, location);
      }
    }
    if (typeof operation.summary !== "string" || operation.summary.trim() === "") {
      report(`${location}: summary is required`);
    }
    if (typeof operation.description !== "string" || operation.description.trim() === "") {
      report(`${location}: description is required`);
    }
    if (!operation.responses || typeof operation.responses !== "object" || Object.keys(operation.responses).length === 0) {
      report(`${location}: at least one response is required`);
    }
    const authorizationMode = operation["x-authorization-mode"];
    if (!authorizationModes.has(authorizationMode)) {
      report(`${location}: x-authorization-mode must be one of ${[...authorizationModes].join(", ")}`);
    }
    const effectiveSecurity = operation.security ?? globalSecurity;
    if (authorizationMode === "public") {
      if (!Array.isArray(operation.security) || operation.security.length !== 0) {
        report(`${location}: public operations must declare security: [] explicitly`);
      }
    } else if (authorizationMode === "system-fixed") {
      if (!Array.isArray(effectiveSecurity)) {
        report(`${location}: system-fixed operations must declare security explicitly`);
      }
    } else if (!Array.isArray(effectiveSecurity) || effectiveSecurity.length === 0) {
      report(`${location}: non-public operations must declare an effective security requirement`);
    }
    const featureCode = operation["x-feature-code"];
    const featureCodes = operation["x-feature-codes"];
    if (authorizationMode === "feature-code" && (typeof featureCode !== "string" || featureCode.trim() === "")) {
      report(`${location}: feature-code authorization requires x-feature-code`);
    } else if (featureCode && !permissionCodes.has(featureCode)) {
      report(`${location}: x-feature-code '${featureCode}' is not registered in feature.yaml permissionCodes`);
    }
    if (authorizationMode === "feature-code-all") {
      if (!Array.isArray(featureCodes) || featureCodes.length < 2 || featureCodes.some((code) => typeof code !== "string" || code.trim() === "")) {
        report(`${location}: feature-code-all authorization requires at least two x-feature-codes`);
      }
    }
    if (featureCodes !== undefined) {
      if (!Array.isArray(featureCodes) || featureCodes.length === 0 || featureCodes.some((code) => typeof code !== "string" || code.trim() === "")) {
        report(`${location}: x-feature-codes must be a non-empty string array when declared`);
      } else {
        for (const code of featureCodes) {
          if (!permissionCodes.has(code)) {
            report(`${location}: x-feature-codes entry '${code}' is not registered in feature.yaml permissionCodes`);
          }
        }
      }
    }
  }

  if (!fs.existsSync(designPath)) {
    return;
  }
  const designOperationIds = parseChapter5OperationIds(readText(designPath));
  const openapiSet = new Set(openapiOperationIds);
  const designSet = new Set(designOperationIds);
  for (const operationId of openapiSet) {
    if (!designSet.has(operationId)) {
      report(`${manifest.id}: design.md is missing operationId '${operationId}'`);
    }
  }
  for (const operationId of designSet) {
    if (!openapiSet.has(operationId)) {
      report(`${manifest.id}: design.md references unknown operationId '${operationId}'`);
    }
  }
}

const catalogSchema = readJson(catalogSchemaPath);
const featureSchema = readJson(featureSchemaPath);
const catalog = readYaml(catalogPath);
const ajv = new Ajv({ allErrors: true });

const validateCatalog = ajv.compile(catalogSchema);
if (!validateCatalog(catalog)) {
  for (const error of validateCatalog.errors ?? []) {
    report(`catalog schema: ${error.instancePath || "/"} ${error.message}`);
  }
}

const features = Array.isArray(catalog.features) ? catalog.features : [];
validateUnique(features, "id");
validateUnique(features, "legacyNo");
validateUnique(features, "slug");

const featureIds = new Set(features.map((feature) => feature.id));
for (const feature of features) {
  for (const coveredBy of feature.coveredBy ?? []) {
    if (!featureIds.has(coveredBy)) {
      report(`${feature.id}: coveredBy references unknown feature '${coveredBy}'`);
    }
  }
}

const indexRows = parseIndexRows(readText(apiIndexPath));
const indexByNo = new Map(indexRows.map((row) => [row.legacyNo, row]));
for (const feature of features) {
  const row = indexByNo.get(feature.legacyNo);
  if (!row) {
    report(`${feature.id}: legacyNo '${feature.legacyNo}' is missing from API設計書_一覧.md`);
    continue;
  }
  if (feature.title !== row.title) {
    report(`${feature.id}: title differs (catalog='${feature.title}', index='${row.title}')`);
  }
  if (feature.phase !== row.phase) {
    report(`${feature.id}: phase differs (catalog=${feature.phase}, index=${row.phase})`);
  }
  if (feature.status !== row.status) {
    report(`${feature.id}: status differs (catalog='${feature.status}', index='${row.status}')`);
  }
}
for (const row of indexRows) {
  if (!features.some((feature) => feature.legacyNo === row.legacyNo)) {
    report(`API設計書_一覧.md: No.${row.legacyNo} is missing from catalog.yaml`);
  }
}

const legacySpecRoot = resolveFromCatalog(catalog.defaults.legacySpecRoot);
const approvedWordRoot = resolveFromCatalog(catalog.defaults.approvedWordRoot);
const catalogSpecs = features
  .map((feature) => feature.legacySpec)
  .filter(Boolean)
  .sort();
const catalogWords = features
  .map((feature) => feature.approvedWord)
  .filter(Boolean)
  .sort();
const catalogManifests = new Map();

for (const feature of features) {
  for (const [field, isMigration] of [["manifest", false], ["migrationManifest", true]]) {
    if (!feature[field]) {
      continue;
    }
    const manifestPath = resolveFromCatalog(feature[field]);
    catalogManifests.set(path.normalize(manifestPath), { feature, isMigration });
    reportMissingFile(`${feature.id}: ${field}`, manifestPath, apiDir);
  }
}

for (const spec of catalogSpecs) {
  if (!fs.existsSync(path.join(legacySpecRoot, spec))) {
    report(`catalog: legacy spec does not exist '${spec}'`);
  }
}
for (const spec of listFiles(legacySpecRoot, ".ps1")) {
  if (!catalogSpecs.includes(spec)) {
    report(`legacy spec is not registered in catalog '${spec}'`);
  }
}
for (const word of catalogWords) {
  if (!fs.existsSync(path.join(approvedWordRoot, word))) {
    report(`catalog: approved Word does not exist '${word}'`);
  }
}
for (const word of listFiles(approvedWordRoot, ".docx")) {
  if (!catalogWords.includes(word)) {
    report(`approved Word is not registered in catalog '${word}'`);
  }
}

const validateFeature = ajv.compile(featureSchema);
const featureDirectories = fs.existsSync(featureRoot)
  ? fs.readdirSync(featureRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : [];

for (const directory of featureDirectories) {
  const manifestPath = path.join(featureRoot, directory.name, "feature.yaml");
  const isTemplate = directory.name === "_template";

  if (fs.existsSync(manifestPath)) {
    const manifest = readYaml(manifestPath);
    if (!validateFeature(manifest)) {
      for (const error of validateFeature.errors ?? []) {
        report(`${toPosix(path.relative(taniguchiDir, manifestPath))}: ${error.instancePath || "/"} ${error.message}`);
      }
    }
    if (!isTemplate && manifest.slug !== directory.name) {
      report(`${manifest.id}: manifest slug '${manifest.slug}' differs from directory '${directory.name}'`);
    }
    if (isTemplate) {
      continue;
    }

    const catalogRegistration = catalogManifests.get(path.normalize(manifestPath));
    if (!catalogRegistration) {
      report(`${manifest.id}: feature.yaml is not registered by catalog.yaml manifest or migrationManifest`);
    } else {
      const { feature: catalogFeature, isMigration } = catalogRegistration;
      const matchingKeys = isMigration
        ? ["id", "slug", "title", "phase"]
        : ["id", "slug", "title", "phase", "status", "authoringMode"];
      for (const key of matchingKeys) {
        if (manifest[key] !== catalogFeature[key]) {
          report(`${manifest.id}: manifest ${key} differs from catalog (${JSON.stringify(manifest[key])} != ${JSON.stringify(catalogFeature[key])})`);
        }
      }
      if (isMigration && manifest.authoringMode !== "openapi") {
        report(`${manifest.id}: migrationManifest must reference an openapi authoring manifest`);
      }
      if (catalogFeature.approvedWord && manifest.deliverable?.word) {
        const manifestWord = resolveFromManifest(manifestPath, manifest.deliverable.word);
        const catalogWord = path.join(approvedWordRoot, catalogFeature.approvedWord);
        if (path.normalize(manifestWord) !== path.normalize(catalogWord)) {
          report(`${manifest.id}: deliverable.word differs from catalog approvedWord`);
        }
      }
    }

    for (const relatedFeature of manifest.relatedFeatures ?? []) {
      if (!featureIds.has(relatedFeature)) {
        report(`${manifest.id}: relatedFeatures references unknown feature '${relatedFeature}'`);
      }
    }

    for (const [sourceName, relativePath] of Object.entries(manifest.sources ?? {})) {
      reportMissingFile(`${manifest.id}: sources.${sourceName}`, resolveFromManifest(manifestPath, relativePath));
    }
    if (manifest.deliverable?.template) {
      reportMissingFile(`${manifest.id}: deliverable.template`, resolveFromManifest(manifestPath, manifest.deliverable.template));
    }
    if (manifest.status === "Fix" && manifest.deliverable?.word) {
      reportMissingFile(`${manifest.id}: deliverable.word`, resolveFromManifest(manifestPath, manifest.deliverable.word));
    }

    const databasePath = manifest.sources?.database
      ? resolveFromManifest(manifestPath, manifest.sources.database)
      : undefined;
    if (databasePath && fs.existsSync(databasePath)) {
      const databaseEntities = parsePumlEntities(readText(databasePath));
      for (const table of manifest.dbTables ?? []) {
        if (!databaseEntities.has(table)) {
          report(`${manifest.id}: dbTables references unknown PUML entity '${table}'`);
        }
      }
    }

    if (manifest.authoringMode === "openapi") {
      const openapiPath = resolveFromManifest(manifestPath, manifest.sources.openapi);
      const designPath = resolveFromManifest(manifestPath, manifest.sources.design);
      const openapiMissing = reportMissingFile(`${manifest.id}: OpenAPI source`, openapiPath);
      const designMissing = reportMissingFile(`${manifest.id}: design source`, designPath);
      if (!openapiMissing && !designMissing) {
        await validateOpenApiFeature({ manifest, openapiPath, designPath });
      }
    }
  }
}

for (const relativePath of [
  "common/schemas/error-response.yaml",
  "common/security/bearer-auth.yaml",
]) {
  try {
    readYaml(path.join(apiDir, relativePath));
  } catch (error) {
    report(`${relativePath}: ${error.message}`);
  }
}

if (errors.length > 0) {
  console.error(`API design foundation verification failed (${errors.length} issue(s)):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `API design foundation verified: ${features.length} features, ${catalogSpecs.length} legacy specs, ${catalogWords.length} approved Word files.`,
);
