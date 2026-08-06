import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { load as loadYaml } from "js-yaml";

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);
const EXPECTED_FEATURES = 29;
const EXPECTED_OPERATIONS = 318;
const sourceOnly = process.argv.slice(2).includes("--source-only");

const repoRoot = process.cwd();
const apiDir = path.join(repoRoot, "taniguchi", "api");
const scriptsDir = path.join(repoRoot, "taniguchi", "scripts");
const auditDir = path.join(
  repoRoot,
  "work",
  "api-openapi-migration",
  sourceOnly ? "source-audit" : "full-audit",
);
const catalogPath = path.join(apiDir, "catalog.yaml");
const migrationPlanPath = path.join(apiDir, "OPENAPI移行計画.md");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
}

function readYaml(filePath) {
  return loadYaml(readText(filePath));
}

function resolveRelative(ownerPath, relativePath) {
  return path.resolve(path.dirname(ownerPath), relativePath);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    const details = [result.stdout, result.stderr, result.error?.message].filter(Boolean).join("\n").trim();
    throw new Error(`${command} ${args.join(" ")} failed${details ? `\n${details}` : ""}`);
  }
  return result.stdout.trim();
}

function operationEntries(openapi) {
  const entries = [];
  for (const [apiPath, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (HTTP_METHODS.has(method)) {
        entries.push({ apiPath, method, operation });
      }
    }
  }
  return entries;
}

const errors = [];
const catalog = readYaml(catalogPath);
const migrationPlan = readText(migrationPlanPath);
const features = (catalog.features ?? []).filter((feature) => feature.status === "Fix");
const operationOwners = new Map();
const results = [];

fs.mkdirSync(auditDir, { recursive: true });

if (features.length !== EXPECTED_FEATURES) {
  errors.push(`Fix feature count: expected ${EXPECTED_FEATURES}, actual ${features.length}`);
}

for (const feature of features) {
  try {
    if (feature.authoringMode !== "openapi") {
      throw new Error(`authoringMode must be openapi, received ${feature.authoringMode}`);
    }
    if (!feature.manifest || feature.migrationManifest) {
      throw new Error("catalog must contain manifest and must not contain migrationManifest");
    }

    const manifestPath = path.resolve(apiDir, feature.manifest);
    const manifest = readYaml(manifestPath);
    if (manifest.id !== feature.id || manifest.slug !== feature.slug) {
      throw new Error(`manifest identity mismatch: ${manifest.id}/${manifest.slug}`);
    }
    if (manifest.status !== "Fix" || manifest.authoringMode !== "openapi") {
      throw new Error(`manifest must be Fix/openapi, received ${manifest.status}/${manifest.authoringMode}`);
    }

    const openapiPath = resolveRelative(manifestPath, manifest.sources.openapi);
    const designPath = resolveRelative(manifestPath, manifest.sources.design);
    const legacySpecPath = resolveRelative(manifestPath, manifest.sources.legacySpec);
    const wordPath = resolveRelative(manifestPath, manifest.deliverable.word);
    const requiredTargets = { openapiPath, designPath, legacySpecPath };
    if (!sourceOnly) {
      requiredTargets.wordPath = wordPath;
    }
    for (const [label, targetPath] of Object.entries(requiredTargets)) {
      if (!fs.existsSync(targetPath)) {
        throw new Error(`${label} not found: ${targetPath}`);
      }
    }

    const openapi = readYaml(openapiPath);
    const operations = operationEntries(openapi);
    for (const { apiPath, method, operation } of operations) {
      if (!operation.operationId) {
        throw new Error(`${method.toUpperCase()} ${apiPath}: operationId is missing`);
      }
      const previousOwner = operationOwners.get(operation.operationId);
      if (previousOwner) {
        throw new Error(`duplicate operationId '${operation.operationId}' with ${previousOwner}`);
      }
      operationOwners.set(operation.operationId, feature.id);
    }

    const planLine = migrationPlan.split(/\r?\n/).find((line) => line.includes(`| ${feature.id} |`));
    if (!planLine || !planLine.includes("移行済み")) {
      throw new Error("migration plan is not marked as migrated");
    }

    const legacyJsonPath = path.join(auditDir, `${feature.slug}-legacy.json`);
    const wordModelPath = path.join(auditDir, `${feature.slug}-word-model.json`);
    run("pwsh", [
      "-NoProfile",
      "-File",
      path.join(scriptsDir, "export-legacy-api-spec-json.ps1"),
      "-SpecPath",
      legacySpecPath,
      "-OutputPath",
      legacyJsonPath,
    ]);
    run(process.execPath, [
      path.join(scriptsDir, "build-api-word-model.mjs"),
      "--manifest",
      manifestPath,
      "--output",
      wordModelPath,
    ]);
    if (!sourceOnly) {
      run(process.execPath, [
        path.join(scriptsDir, "verify-api-word-content.mjs"),
        "--model",
        wordModelPath,
        "--word",
        wordPath,
      ]);
    }
    run(process.execPath, [
      path.join(scriptsDir, "compare-api-migration-parity.mjs"),
      "--legacy",
      legacyJsonPath,
      "--model",
      wordModelPath,
      "--mode",
      manifest.migrationParity ?? "strict",
    ]);

    results.push({
      id: feature.id,
      slug: feature.slug,
      operations: operations.length,
      word: path.relative(repoRoot, wordPath).split(path.sep).join("/"),
      wordContent: sourceOnly ? "deferred" : "verified",
      parity: "verified",
      parityMode: manifest.migrationParity ?? "strict",
    });
  }
  catch (error) {
    errors.push(`${feature.id} ${feature.slug}: ${error.message}`);
  }
}

const operationCount = results.reduce((sum, result) => sum + result.operations, 0);
if (operationCount !== EXPECTED_OPERATIONS) {
  errors.push(`operation count: expected ${EXPECTED_OPERATIONS}, actual ${operationCount}`);
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: sourceOnly ? "source-only" : "delivery",
  expected: { features: EXPECTED_FEATURES, operations: EXPECTED_OPERATIONS },
  actual: {
    features: results.length,
    operations: operationCount,
    uniqueOperationIds: operationOwners.size,
    approvedWords: sourceOnly ? 0 : results.length,
    wordContentVerified: results.filter((result) => result.wordContent === "verified").length,
    parityVerified: results.filter((result) => result.parity === "verified").length,
  },
  results,
  errors,
};
fs.writeFileSync(path.join(auditDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (errors.length > 0) {
  console.error(`API OpenAPI migration audit failed (${errors.length} issue(s)):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

if (sourceOnly) {
  console.log(
    `API OpenAPI source audit verified: ${results.length} features, ${operationCount} operations, `
      + `${operationOwners.size} unique operationIds, ${results.length} parity checks. Word checks deferred.`,
  );
}
else {
  console.log(
    `API OpenAPI delivery audit verified: ${results.length} features, ${operationCount} operations, `
      + `${operationOwners.size} unique operationIds, ${results.length} approved Word files, `
      + `${results.length} Word content checks, ${results.length} parity checks.`,
  );
}
console.log(path.join(auditDir, "report.json"));
