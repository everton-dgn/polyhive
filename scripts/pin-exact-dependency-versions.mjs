import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const rootPackagePath = path.join(rootDir, "package.json");
const lockfilePath = path.join(rootDir, "package-lock.json");
const dependencySections = ["dependencies", "devDependencies"];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function isRangeToPin(spec) {
  return typeof spec === "string" && /^[~^]\d/.test(spec);
}

function getAncestorPaths(importerPath) {
  if (!importerPath) {
    return [""];
  }

  const segments = importerPath.split("/").filter(Boolean);
  const ancestors = [];

  for (let length = segments.length; length >= 0; length -= 1) {
    ancestors.push(segments.slice(0, length).join("/"));
  }

  return ancestors;
}

function resolveLinkedVersion(lockPackages, entry, depName, candidateKey) {
  if (!entry?.link || typeof entry.resolved !== "string") {
    return "";
  }

  const resolvedKey = path.posix.normalize(entry.resolved);
  const resolvedEntry = lockPackages[resolvedKey];

  if (typeof resolvedEntry?.version === "string") {
    return resolvedEntry.version;
  }

  throw new Error(
    `Expected linked package ${depName} at ${candidateKey} to resolve to a package with version`,
  );
}

function resolveInstalledVersion(lockPackages, importerPath, depName) {
  for (const ancestorPath of getAncestorPaths(importerPath)) {
    const candidateKey = ancestorPath
      ? `${ancestorPath}/node_modules/${depName}`
      : `node_modules/${depName}`;
    const entry = lockPackages[candidateKey];

    if (!entry) {
      continue;
    }

    if (typeof entry.version === "string") {
      return entry.version;
    }

    const linkedVersion = resolveLinkedVersion(lockPackages, entry, depName, candidateKey);
    if (linkedVersion) {
      return linkedVersion;
    }
  }

  throw new Error(
    `Could not resolve installed version for ${depName} from importer ${importerPath || "<root>"}`,
  );
}

const rootPackage = readJson(rootPackagePath);
const lockfile = readJson(lockfilePath);
const lockPackages = lockfile.packages ?? {};

if (!lockPackages[""]) {
  throw new Error('package-lock.json must contain the root package entry ""');
}

const packageFiles = [rootPackagePath];
for (const workspacePath of Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : []) {
  const packagePath = path.join(rootDir, workspacePath, "package.json");
  if (existsSync(packagePath)) {
    packageFiles.push(packagePath);
  }
}

const touchedFiles = [];

for (const packagePath of packageFiles) {
  const pkg = readJson(packagePath);
  const importerPath = path.posix.dirname(
    path.relative(rootDir, packagePath).replaceAll(path.sep, "/"),
  );
  const normalizedImporterPath = importerPath === "." ? "" : importerPath;
  const changes = [];

  for (const section of dependencySections) {
    const deps = pkg[section];
    if (!deps || typeof deps !== "object") {
      continue;
    }

    for (const [depName, currentSpec] of Object.entries(deps)) {
      if (!isRangeToPin(currentSpec)) {
        continue;
      }

      const resolvedVersion = resolveInstalledVersion(
        lockPackages,
        normalizedImporterPath,
        depName,
      );
      deps[depName] = resolvedVersion;
      changes.push({ depName, currentSpec, resolvedVersion, section });
    }
  }

  if (changes.length === 0) {
    continue;
  }

  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
  touchedFiles.push({
    packagePath: path.relative(rootDir, packagePath),
    changes,
  });
}

if (touchedFiles.length === 0) {
  console.log("All dependency versions are already pinned to exact versions.");
  process.exit(0);
}

console.log("Pinned dependency versions:");
for (const file of touchedFiles) {
  console.log(`- ${file.packagePath}`);
  for (const change of file.changes) {
    console.log(
      `  ${change.section}:${change.depName} ${change.currentSpec} -> ${change.resolvedVersion}`,
    );
  }
}
