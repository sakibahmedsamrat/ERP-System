import { PrismaClient } from '@prisma/client';

/**
 * Ensures connection URL has optimal timeouts for serverless environments.
 * Prevents requests from hanging indefinitely when PostgreSQL is sleeping, firewalled, or unreachable.
 */
function getOptimizedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:') {
      // Connect timeout in seconds (fail fast if DB server is unreachable)
      if (!parsed.searchParams.has('connect_timeout')) {
        parsed.searchParams.set('connect_timeout', '10');
      }
      // Pool timeout in seconds
      if (!parsed.searchParams.has('pool_timeout')) {
        parsed.searchParams.set('pool_timeout', '10');
      }
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

const prismaClientSingleton = () => {
  const optimizedUrl = getOptimizedDatabaseUrl();
  return new PrismaClient({
    datasources: optimizedUrl
      ? {
          db: {
            url: optimizedUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// In serverless environments, retaining the client in globalThis prevents multiple instances across warm lambdas
if (process.env.NODE_ENV !== 'production' || !globalThis.prismaGlobal) {
  globalThis.prismaGlobal = prisma;
}

/**
 * Executes a database promise with a timeout safeguard to prevent hanging Vercel serverless functions.
 * If the query exceeds `timeoutMs`, the promise rejects with a timeout error or returns `fallbackValue`.
 */
export async function withDbTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 8000,
  fallbackValue?: T
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      if (fallbackValue !== undefined) {
        resolve(fallbackValue);
      } else {
        reject(new Error(`Database operation timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default prisma;
