import type { Debug } from 'debug';

type Context = Record<string, unknown>;

export interface LoggerOptions {
    context?: Context;
}

const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let debug: Debug | any;

if (isReactNative) {
    // In React Native, the 'debug' library can cause issues with the 'tty' module.
    // We provide a simple console.log-based fallback to avoid this.
    console.log('[create-logger] React Native environment detected. Using console.log for debugging.');

    const namespaces: RegExp[] = [];
    const skipped: RegExp[] = [];

    const enable = (settings?: string) => {
        namespaces.length = 0;
        skipped.length = 0;

        const splits = (settings || '').split(/[\s,]+/);

        for (const split of splits) {
            if (!split) {
                continue;
            }
            const pattern = split.replace(/\*/g, '.*?');
            if (pattern[0] === '-') {
                skipped.push(new RegExp('^' + pattern.slice(1) + '$'));
            } else {
                namespaces.push(new RegExp('^' + pattern + '$'));
            }
        }
    };

    const isEnabled = (namespace: string) => {
        if (skipped.some(re => re.test(namespace))) {
            return false;
        }
        return namespaces.some(re => re.test(namespace));
    };

    const createDebugger = (namespace: string) => {
        const dbg = (...args: unknown[]) => {
            if (isEnabled(namespace)) {
                console.log(namespace, ...args);
            }
        };
        return dbg;
    };
    debug = createDebugger;
    debug.enable = enable;
} else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    debug = require('debug');
}

// Auto-enable debug in the browser if NEXT_PUBLIC_DEBUG is set
// This code runs once when the module is first imported.
// It sets up the debug library based on the environment variable.
if (typeof window !== 'undefined' && !isReactNative) {
    // Ensure this runs only in the browser and not RN
    const debugEnvVar = process.env.NEXT_PUBLIC_DEBUG;
    // Log the value of the env var for easier debugging of the logger setup itself.
    console.log(`[create-logger] Initializing debug. Found NEXT_PUBLIC_DEBUG: "${debugEnvVar}"`);

    if (debugEnvVar) {
        // If the env var is set, enable the specified debug namespaces.
        // This will also persist the setting to localStorage by the debug library.
        debug.enable(debugEnvVar);
    }
} else if (isReactNative) {
    const debugEnvVar = process.env.DEBUG;
    console.log(`[create-logger] Initializing debug for React Native. Found DEBUG: "${debugEnvVar}"`);
    if (debugEnvVar) {
        debug.enable(debugEnvVar);
    }
}

export const createLogger = (namespace: string, opts?: LoggerOptions) => {
    const dbg = debug(namespace);
    const context = opts?.context ?? {};
    const originalNamespace = namespace;
    return {
        extend: (namespace: string, opts?: LoggerOptions) => {
            return createLogger(`${originalNamespace}:${namespace}`, { context: { ...context, ...opts?.context } });
        },
        debug: (msg: string, ...args: any[]) => {
            const timestamp = new Date().toISOString();
            // Let debug handle the object formatting naturally
            dbg(`[${timestamp}] [DEBUG] ${msg}`, ...args);
        },
        info: (msg: string, ...args: any[]) => {
            const timestamp = new Date().toISOString();
            dbg(`[${timestamp}] [INFO] ${msg}`, ...args);
        },
        warn: (msg: string, ...args: any[]) => {
            const timestamp = new Date().toISOString();
            dbg(`[${timestamp}] [WARN] ${msg}`, ...args);
        },
        error: (msg: string, ...args: any[]) => {
            const timestamp = new Date().toISOString();
            dbg(`[${timestamp}] [ERROR] ${msg}`, ...args);
        },
    };
};
