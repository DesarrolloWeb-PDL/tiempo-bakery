import { readFile } from 'node:fs/promises';
import { lookup } from 'node:dns/promises';
import path from 'node:path';

type EnvMap = Record<string, string>;

type CheckResult = {
  ok: boolean;
  details: string[];
};

const REQUIRED_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
const OPTIONAL_KEYS = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;
const STORAGE_BUCKET = 'productos';

function parseEnvContent(content: string): EnvMap {
  const result: EnvMap = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

async function loadEnvFromFile(filePath: string): Promise<EnvMap> {
  try {
    const content = await readFile(filePath, 'utf8');
    return parseEnvContent(content);
  } catch {
    return {};
  }
}

async function loadEffectiveEnv(): Promise<EnvMap> {
  const root = process.cwd();
  const env = await loadEnvFromFile(path.join(root, '.env'));
  const envLocal = await loadEnvFromFile(path.join(root, '.env.local'));

  return {
    ...env,
    ...envLocal,
  };
}

function checkRequiredKeys(values: EnvMap): CheckResult {
  const details: string[] = [];
  let ok = true;

  for (const key of REQUIRED_KEYS) {
    if (!values[key]?.trim()) {
      ok = false;
      details.push(`${key}: MISSING`);
    } else {
      details.push(`${key}: SET`);
    }
  }

  for (const key of OPTIONAL_KEYS) {
    details.push(`${key}: ${values[key]?.trim() ? 'SET' : 'MISSING'}`);
  }

  return { ok, details };
}

async function checkDns(hostname: string): Promise<CheckResult> {
  try {
    const resolved = await lookup(hostname);
    return {
      ok: true,
      details: [`DNS: OK (${resolved.address})`],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      details: [`DNS: FAIL (${message})`],
    };
  }
}

async function checkStorageApi(url: string, serviceRoleKey: string): Promise<CheckResult> {
  const endpoint = `${url.replace(/\/$/, '')}/storage/v1/bucket`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        details: [`Storage API: FAIL (HTTP ${response.status})`],
      };
    }

    const payload = (await response.json()) as Array<{ name?: string }>;
    const hasProductos = Array.isArray(payload)
      ? payload.some((bucket) => bucket.name === STORAGE_BUCKET)
      : false;

    return {
      ok: hasProductos,
      details: [
        'Storage API: OK',
        `Bucket ${STORAGE_BUCKET}: ${hasProductos ? 'EXISTS' : 'MISSING'}`,
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      details: [`Storage API: FAIL (${message})`],
    };
  }
}

async function main() {
  console.log('Supabase health-check (storage)');

  const envValues = await loadEffectiveEnv();
  const envCheck = checkRequiredKeys(envValues);
  for (const line of envCheck.details) {
    console.log(line);
  }

  if (!envCheck.ok) {
    console.log('RESULT: FAIL (faltan variables obligatorias)');
    process.exitCode = 1;
    return;
  }

  const supabaseUrl = envValues.NEXT_PUBLIC_SUPABASE_URL?.trim() || envValues.SUPABASE_URL?.trim() || '';
  const serviceRoleKey = envValues.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

  let hostname: string;
  try {
    hostname = new URL(supabaseUrl).hostname;
    console.log(`Host: ${hostname}`);
  } catch {
    console.log('URL: FAIL (NEXT_PUBLIC_SUPABASE_URL no es una URL válida)');
    console.log('RESULT: FAIL');
    process.exitCode = 1;
    return;
  }

  const dnsCheck = await checkDns(hostname);
  for (const line of dnsCheck.details) {
    console.log(line);
  }
  if (!dnsCheck.ok) {
    console.log('RESULT: FAIL (host no resolvible)');
    process.exitCode = 1;
    return;
  }

  const storageCheck = await checkStorageApi(supabaseUrl, serviceRoleKey);
  for (const line of storageCheck.details) {
    console.log(line);
  }

  if (!storageCheck.ok) {
    console.log('RESULT: FAIL (storage no listo)');
    process.exitCode = 1;
    return;
  }

  console.log('RESULT: OK (Supabase Storage listo para uploads persistentes)');
}

main().catch((error) => {
  console.error('Supabase health-check failed unexpectedly.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
