import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const workspaceRoot = process.cwd();
const apiRoot = path.join(workspaceRoot, 'src', 'app', 'api');

async function collectRouteFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return collectRouteFiles(fullPath);
      }

      return entry.isFile() && entry.name === 'route.ts' ? [fullPath] : [];
    }),
  );

  return files.flat().sort();
}

function toRelative(filePath: string) {
  return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
}

async function main() {
  const routeFiles = await collectRouteFiles(apiRoot);
  const failures: Array<{ file: string; message: string }> = [];

  for (const filePath of routeFiles) {
    try {
      await import(pathToFileURL(filePath).href);
      console.log(`OK ${toRelative(filePath)}`);
    } catch (error) {
      const message = error instanceof Error ? error.stack || error.message : String(error);
      failures.push({ file: toRelative(filePath), message });
      console.error(`FAIL ${toRelative(filePath)}`);
      console.error(message);
    }
  }

  if (failures.length > 0) {
    console.error(`\nPredeploy check failed: ${failures.length} route module(s) threw during import.`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nPredeploy check passed: imported ${routeFiles.length} route module(s) successfully.`);
}

main().catch((error) => {
  console.error('Predeploy check failed unexpectedly.');
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});