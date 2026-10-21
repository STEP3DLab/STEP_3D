import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stageRoot = path.join(projectRoot, ".pages-build");
const outputRoot = path.join(projectRoot, "pages-dist");
const previousOrigin = "https://trifoti.step3d.chatgpt.site";
const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://step3dlab.github.io";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/STEP_3D/trifoti";
const deploymentBase = `${siteOrigin}${basePath}`;
const prepareOnly = process.argv.includes("--prepare-only");

assert.equal(new URL(siteOrigin).origin, siteOrigin, "NEXT_PUBLIC_SITE_ORIGIN must contain only an HTTPS origin, without a trailing slash");
assert.equal(new URL(siteOrigin).protocol, "https:", "The portfolio must use HTTPS");
assert.match(basePath, /^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+$/, "NEXT_PUBLIC_BASE_PATH must be a repository path without a trailing slash");

function withBase(value) {
  if (!value.startsWith("/") || value.startsWith("//")) return value;
  if (value === basePath || value.startsWith(`${basePath}/`) || value.startsWith(`${basePath}?`) || value.startsWith(`${basePath}#`)) return value;
  return `${basePath}${value}`;
}

function publicLiteral(value) {
  if (value === previousOrigin || value.startsWith(`${previousOrigin}/`)) return `${deploymentBase}${value.slice(previousOrigin.length)}`;
  if (/^\/(?:images\/|videos\/|downloads\/|fonts\/|favicon\.svg(?:$|[?#]))/.test(value)) return withBase(value);
  return value;
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : [file];
  }));
  return nested.flat();
}

/**
 * Changes only the disposable copy, never the Sites source tree:
 * - public asset literals receive the Pages prefix;
 * - ordinary anchors use sitePath, while next/link keeps its own basePath logic;
 * - legacy per-page origins and metadata are resolved to the portfolio URL;
 * - new URL(path, origin) preserves the path prefix for dynamic metadata.
 */
function transformForPages(sourceText, file) {
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  let needsPathHelper = false;
  const helper = "__trifotiPagesPath";
  const transform = context => {
    const visitor = node => {
      if (ts.isStringLiteral(node)) {
        const value = publicLiteral(node.text);
        if (value !== node.text) return ts.factory.createStringLiteral(value);
      }
      if (ts.isNoSubstitutionTemplateLiteral(node)) {
        const value = publicLiteral(node.text);
        if (value !== node.text) return ts.factory.createNoSubstitutionTemplateLiteral(value);
      }
      if (ts.isTemplateExpression(node)) {
        const value = publicLiteral(node.head.text);
        if (value !== node.head.text) {
          return ts.factory.updateTemplateExpression(node, ts.factory.createTemplateHead(value), node.templateSpans.map(span => ts.visitEachChild(span, visitor, context)));
        }
      }

      const visited = ts.visitEachChild(node, visitor, context);
      if (ts.isNewExpression(visited) && ts.isIdentifier(visited.expression) && visited.expression.text === "URL" && visited.arguments?.length === 2) {
        const [url, origin] = visited.arguments;
        if ((ts.isIdentifier(origin) && ["origin", "base"].includes(origin.text)) || (ts.isStringLiteral(origin) && origin.text === deploymentBase)) {
          needsPathHelper = true;
          return ts.factory.updateNewExpression(visited, visited.expression, visited.typeArguments, [ts.factory.createCallExpression(ts.factory.createIdentifier(helper), undefined, [url]), origin]);
        }
      }
      if (ts.isPropertyAssignment(visited)) {
        const property = ts.isIdentifier(visited.name) || ts.isStringLiteral(visited.name) ? visited.name.text : "";
        if (["canonical", "url"].includes(property) && ts.isStringLiteral(visited.initializer) && visited.initializer.text.startsWith("/") && !visited.initializer.text.startsWith("//")) {
          return ts.factory.updatePropertyAssignment(visited, visited.name, ts.factory.createStringLiteral(`${siteOrigin}${withBase(visited.initializer.text)}`));
        }
      }
      if (ts.isJsxAttribute(visited) && ts.isIdentifier(visited.name) && visited.name.text === "href") {
        const tag = node.parent?.parent;
        if (tag && (ts.isJsxOpeningElement(tag) || ts.isJsxSelfClosingElement(tag)) && ts.isIdentifier(tag.tagName) && tag.tagName.text === "a" && visited.initializer) {
          const expression = ts.isStringLiteral(visited.initializer) ? visited.initializer : ts.isJsxExpression(visited.initializer) ? visited.initializer.expression : undefined;
          if (expression) {
            needsPathHelper = true;
            return ts.factory.updateJsxAttribute(visited, visited.name, ts.factory.createJsxExpression(undefined, ts.factory.createCallExpression(ts.factory.createIdentifier(helper), undefined, [expression])));
          }
        }
      }
      return visited;
    };
    return node => ts.visitNode(node, visitor);
  };
  const transformed = ts.transform(sourceFile, [transform]);
  let result = transformed.transformed[0];
  if (needsPathHelper) {
    let importPath = path.relative(path.dirname(file), path.join(stageRoot, "app", "site-config")).split(path.sep).join("/");
    if (!importPath.startsWith(".")) importPath = `./${importPath}`;
    const declaration = ts.factory.createImportDeclaration(undefined, ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports([
      ts.factory.createImportSpecifier(false, ts.factory.createIdentifier("sitePath"), ts.factory.createIdentifier(helper)),
    ])), ts.factory.createStringLiteral(importPath));
    const statements = [...result.statements];
    const afterDirectives = statements.findIndex(statement => !ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression));
    statements.splice(afterDirectives < 0 ? statements.length : afterDirectives, 0, declaration);
    result = ts.factory.updateSourceFile(result, statements);
  }
  const printed = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(result);
  transformed.dispose();
  return printed;
}

async function prepare() {
  await rm(stageRoot, { recursive: true, force: true });
  await mkdir(stageRoot, { recursive: true });
  const excludedRoutes = new Set(["api", "leads", "status"]);
  await cp(path.join(projectRoot, "app"), path.join(stageRoot, "app"), {
    recursive: true,
    filter: source => {
      const relative = path.relative(path.join(projectRoot, "app"), source).split(path.sep);
      return !excludedRoutes.has(relative[0]);
    },
  });
  await cp(path.join(projectRoot, "public"), path.join(stageRoot, "public"), { recursive: true, filter: source => path.basename(source) !== "__trifoti_qa.html" });
  await cp(path.join(projectRoot, "postcss.config.mjs"), path.join(stageRoot, "postcss.config.mjs"));
  await cp(path.join(projectRoot, "scripts", "pages-export-config.mjs"), path.join(stageRoot, "next.config.mjs"));
  const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
  await writeFile(path.join(stageRoot, "package.json"), `${JSON.stringify({ name: "trifoti-portfolio-export", private: true, type: "module", dependencies: packageJson.dependencies }, null, 2)}\n`);
  const sourceTsconfig = JSON.parse(await readFile(path.join(projectRoot, "tsconfig.json"), "utf8"));
  await writeFile(path.join(stageRoot, "tsconfig.json"), `${JSON.stringify({
    compilerOptions: { ...sourceTsconfig.compilerOptions, incremental: false },
    include: ["next-env.d.ts", "app/**/*.ts", "app/**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  }, null, 2)}\n`);
  for (const file of await sourceFiles(path.join(stageRoot, "app"))) {
    if (file.endsWith(".css")) {
      const stylesheet = await readFile(file, "utf8");
      await writeFile(file, stylesheet.replace(/url\((['"]?)(\/(?:images|videos|downloads|fonts)\/[^)'"\s]+)\1\)/g, (_match, quote, url) => `url(${quote}${withBase(url)}${quote})`));
      continue;
    }
    if (!/\.tsx?$/.test(file) || path.basename(file) === "site-config.ts") continue;
    await writeFile(file, transformForPages(await readFile(file, "utf8"), file));
  }
  await writeFile(path.join(stageRoot, "README.export.md"), [
    "# Disposable portfolio build",
    "Generated by scripts/build-pages.mjs; never edit or publish this staging tree.",
    "API, leads and status routes are excluded. Public media paths, raw anchors and legacy metadata origins are transformed here only.",
    "The source app and its Vinext/Sites build are unchanged. Only out/ becomes pages-dist/ after validation.",
    "No tests, databases, local environment files or runtime state are copied.",
    `Public address: ${deploymentBase}/`,
    "",
  ].join("\n"));
}

async function runBuild() {
  const cli = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [cli, "build", stageRoot, "--webpack"], {
    cwd: stageRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_STATIC_EXPORT: "true",
      NEXT_PUBLIC_SITE_ORIGIN: siteOrigin,
      NEXT_PUBLIC_BASE_PATH: basePath,
    },
  });
  await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`Next.js export failed (${signal || code})`)));
  });
}

async function verifyExport(directory) {
  const requiredPages = ["index.html", "projects/index.html", "services/index.html", "about/index.html", "business/index.html", "cases/parshin-sculptures/index.html", "services/sculptures/index.html", "privacy/index.html", "consent/index.html", "requisites/index.html", "404.html", "robots.txt", "sitemap.xml"];
  for (const file of requiredPages) assert.ok((await stat(path.join(directory, file))).isFile(), `Missing static output: ${file}`);
  const allFiles = await sourceFiles(directory);
  assert.ok(!allFiles.some(file => /^(?:api|leads|status)(?:\/|\.)/.test(path.relative(directory, file).split(path.sep).join("/"))), "Private and backend routes must not be exported");
  let pageCount = 0;
  for (const file of allFiles.filter(file => file.endsWith(".html"))) {
    const html = await readFile(file, "utf8");
    assert.ok(!html.includes(previousOrigin), `Old canonical origin in ${path.relative(directory, file)}`);
    assert.ok(!html.includes(`${basePath}${basePath}`), `Repeated Pages prefix in ${path.relative(directory, file)}`);
    for (const [, href] of html.matchAll(/\b(?:src|href|poster)="([^"<>]+)"/g)) {
      const decoded = href.replaceAll("&amp;", "&");
      if (!decoded.startsWith("/") || decoded.startsWith("//")) continue;
      assert.ok(decoded.startsWith(`${basePath}/`) || decoded === basePath, `Unprefixed local URL ${decoded} in ${path.relative(directory, file)}`);
      const pathname = decodeURIComponent(new URL(decoded, siteOrigin).pathname);
      const relative = pathname.slice(basePath.length).replace(/^\/+/, "");
      const target = path.join(directory, relative);
      if (/\.[A-Za-z0-9]{1,12}$/.test(relative)) assert.ok((await stat(target)).isFile(), `Missing asset: ${relative}`);
      else assert.ok((await stat(path.join(target, "index.html"))).isFile(), `Missing page: ${relative}`);
    }
    pageCount++;
  }
  const sitemap = await readFile(path.join(directory, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes(`${deploymentBase}/cases/parshin-sculptures`), "Sitemap must use the public portfolio prefix");
  const home = await readFile(path.join(directory, "index.html"), "utf8");
  assert.ok(!/type="file"/.test(home), "Static contact flow must not offer a server upload");
  assert.ok(!/href="[^"]*\/leads(?:\/|")/.test(home), "Static portfolio must not link to an absent manager dashboard");
  assert.ok(home.includes("ТРИФОТИ") && home.includes("Фёдор Паршин"), "Studio identity is missing");
  for (const file of allFiles.filter(file => file.endsWith(".css"))) {
    const stylesheet = await readFile(file, "utf8");
    for (const [, url] of stylesheet.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
      if (!url.startsWith("/")) continue;
      assert.ok(url.startsWith(`${basePath}/`), `Unprefixed CSS asset: ${url}`);
      const relative = new URL(url, siteOrigin).pathname.slice(basePath.length).replace(/^\/+/, "");
      assert.ok((await stat(path.join(directory, relative))).isFile(), `Missing CSS asset: ${relative}`);
    }
  }
  return pageCount;
}

await prepare();
console.log(`[pages] Prepared isolated Next.js export for ${deploymentBase}/`);
if (prepareOnly) {
  console.log("[pages] Preparation only; the Sites build and published artifact were not touched.");
} else {
  await runBuild();
  const exported = path.join(stageRoot, "out");
  const pageCount = await verifyExport(exported);
  await rm(outputRoot, { recursive: true, force: true });
  await cp(exported, outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, ".nojekyll"), "");
  console.log(`[pages] Verified ${pageCount} HTML documents; portable portfolio saved to pages-dist/.`);
}
