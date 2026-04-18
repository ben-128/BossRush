import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { resolve as pathResolve } from 'node:path';

/**
 * Serve Unity design JSONs and effects.json live from their source locations
 * so editing them doesn't require a manual sync step. Supports:
 *   /data/cartes/*.json  → ../BossRush/Assets/Data/cartes/
 *   /data/regles/*.json  → ../BossRush/Assets/Data/regles/
 *   /data/effects.json   → ./data/effects.json
 * Dev-server only; production builds still use public/ and the bundled import.
 */
function liveUnityJson(): Plugin {
  const root = pathResolve(__dirname);
  const unityRoot = pathResolve(root, '../BossRush/Assets/Data');
  const effectsPath = pathResolve(root, 'data/effects.json');
  return {
    name: 'live-unity-json',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        const url = req.url.split('?')[0]!;
        let filePath: string | null = null;
        if (url.startsWith('/data/cartes/') && url.endsWith('.json')) {
          filePath = pathResolve(unityRoot, 'cartes', url.slice('/data/cartes/'.length));
        } else if (url.startsWith('/data/regles/') && url.endsWith('.json')) {
          filePath = pathResolve(unityRoot, 'regles', url.slice('/data/regles/'.length));
        } else if (url === '/data/effects.json') {
          filePath = effectsPath;
        }
        if (!filePath) return next();
        try {
          const content = await readFile(filePath, 'utf8');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(content);
        } catch (err) {
          res.statusCode = 404;
          res.end(String(err));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), liveUnityJson()],
  server: {
    port: 5173,
    strictPort: false,
    open: false,
    fs: {
      // Allow importing from the Unity data directory during dev.
      allow: ['..'],
    },
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
});
