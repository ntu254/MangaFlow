import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const collectionPath = path.join(root, "postman", "MangaFlow-API.postman_collection.json");
const environmentPath = path.join(root, "postman", "MangaFlow-Local.postman_environment.json");

const collection = readJson(collectionPath);
const environment = readJson(environmentPath);
const environmentKeys = new Set((environment.values ?? []).map((item) => item.key));
const requiredEnvironmentKeys = [
  "activeAccessToken",
  "adminAccessToken",
  "boardAccessToken",
  "editorAccessToken",
  "mangakaAccessToken",
  "assistantAccessToken",
];
const missingEnvironmentKeys = requiredEnvironmentKeys.filter((key) => !environmentKeys.has(key));
if (missingEnvironmentKeys.length > 0) {
  fail(`Missing Postman environment variables: ${missingEnvironmentKeys.join(", ")}`);
}

const collectionRoutes = new Set();
walkCollection(collection.item, (request) => {
  const rawUrl = typeof request.url === "string" ? request.url : request.url?.raw;
  if (!rawUrl) return;
  collectionRoutes.add(normalizePath(request.method, rawUrl));
});

const routeSource = readRouteSources(path.join(root, "backend", "src", "routes"));
const backendRoutes = new Set([
  "GET /health",
  "GET /ready",
  ...routeSource.flatMap((source) => extractRoutes(source)),
]);

const missing = [...backendRoutes].filter((route) => ![...collectionRoutes].some((candidate) => routesEquivalent(route, candidate))).sort();
const extra = [...collectionRoutes].filter((route) => ![...backendRoutes].some((candidate) => routesEquivalent(candidate, route))).sort();
if (missing.length || extra.length) {
  console.error(JSON.stringify({ missing, extra }, null, 2));
  process.exit(1);
}

console.log(`Postman contract OK: ${backendRoutes.size} backend routes and ${collectionRoutes.size} collection routes.`);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Cannot parse ${path.relative(root, filePath)}: ${error.message}`);
  }
}

function readRouteSources(routesDir) {
  return fs
    .readdirSync(routesDir)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => fs.readFileSync(path.join(routesDir, file), "utf8"));
}

function extractRoutes(source) {
  const routes = [];
  const routePattern = /router\.(get|post|patch|put|delete)\s*\(\s*["`]([^"`]+)["`]/g;
  for (const match of source.matchAll(routePattern)) {
    routes.push(normalizePath(match[1].toUpperCase(), `/api${match[2]}`));
  }
  return routes;
}

function walkCollection(items = [], visit) {
  for (const item of items) {
    if (item.request) visit(item.request);
    if (item.item) walkCollection(item.item, visit);
  }
}

function normalizePath(method, rawUrl) {
  let pathname = rawUrl.replace(/^https?:\/\/[^/]+/i, "");
  pathname = pathname.replace(/^\{\{baseUrl\}\}/, "");
  pathname = pathname.split("?")[0] || "/";
  pathname = pathname.replace(/\{\{[^}]+\}\}/g, "{param}");
  pathname = pathname.replace(/:[^/]+/g, "{param}");
  pathname = pathname.replace(/\/+/g, "/");
  if (pathname !== "/health" && pathname !== "/ready" && !pathname.startsWith("/api/")) {
    pathname = `/api${pathname}`;
  }
  return `${method.toUpperCase()} ${pathname}`;
}

function routesEquivalent(pattern, candidate) {
  const [patternMethod, patternPath] = pattern.split(" ", 2);
  const [candidateMethod, candidatePath] = candidate.split(" ", 2);
  if (patternMethod !== candidateMethod) return false;
  const patternSegments = patternPath.split("/");
  const candidateSegments = candidatePath.split("/");
  return (
    patternSegments.length === candidateSegments.length &&
    patternSegments.every((segment, index) => segment === "{param}" || segment === candidateSegments[index])
  );
}

function fail(message) {
  console.error(`Postman contract failed: ${message}`);
  process.exit(1);
}
