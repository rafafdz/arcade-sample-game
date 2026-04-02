import type { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, type HmrContext, type ViteDevServer } from 'vite';
import { checkRestrictions } from './check-restrictions.lib.js';
import { getCoverCheckResult } from './cover-check.js';
import {
  fetchArcadeChallengeInfo,
  getArcadeChallengeSlug,
  getGitInfo,
  readJsonBody,
  submitArcadeRelease,
  type SubmitReleaseRequest,
} from './release-submission.js';

// Custom plugin to run restriction checks
type ViteResponse = ServerResponse<IncomingMessage>;

function restrictionCheckerPlugin() {
  return {
    name: 'restriction-checker',
    async handleHotUpdate({ file }: HmrContext) {
      if (file.endsWith('game.js')) {
        console.log('\n🔄 Checks updated at', new Date().toLocaleTimeString());
        try {
          const results = await checkRestrictions('./game.js');
          console.log(`   Size: ${results.sizeKB.toFixed(2)} KB`);
          console.log(
            `   Status: ${results.passed ? '✅ Passing' : '❌ Failing'}`,
          );

          if (!results.passed) {
            const failed = results.results.filter((r) => !r.passed);
            failed.forEach((f) => {
              console.log(`   ❌ ${f.name}: ${f.message}`);
            });
          }
        } catch (error) {
          console.error('Error running checks:', error);
        }
      }
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/checks', async (_req, res: ViteResponse) => {
        try {
          const results = await checkRestrictions('./game.js');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(results));
        } catch (_error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to run checks' }));
        }
      });

      server.middlewares.use(
        '/api/git-info',
        async (_req, res: ViteResponse) => {
          try {
            const gitInfo = getGitInfo();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(gitInfo));
          } catch (_error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to get git info' }));
          }
        },
      );

      server.middlewares.use(
        '/api/challenge-info',
        async (_req, res: ViteResponse) => {
          try {
            const challengeInfo = await fetchArcadeChallengeInfo();
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ...challengeInfo,
                sourceSlug: getArcadeChallengeSlug(),
              }),
            );
          } catch (error) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: 'Failed to fetch arcade challenge info',
                details: error instanceof Error ? error.message : 'unknown',
              }),
            );
          }
        },
      );

      server.middlewares.use(
        '/api/cover-check',
        async (_req, res: ViteResponse) => {
          const coverCheck = getCoverCheckResult();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(coverCheck));
        },
      );

      server.middlewares.use(
        '/api/submit-release',
        async (req, res: ViteResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          try {
            const payload = await readJsonBody<SubmitReleaseRequest>(req);
            const result = await submitArcadeRelease(payload);
            res.statusCode = result.success ? 200 : 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                error: 'Failed to process arcade release submission.',
                step: 'submit_release',
                details: error instanceof Error ? error.message : 'unknown',
              }),
            );
          }
        },
      );
    },
  };
}

export default defineConfig({
  root: '.',
  server: {
    port: 3001,
    open: false,
  },
  plugins: [restrictionCheckerPlugin()],
  // Don't optimize dependencies since we're using Phaser from CDN
  optimizeDeps: {
    exclude: ['phaser'],
  },
});
