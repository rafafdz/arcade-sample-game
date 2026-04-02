import { execSync } from 'child_process';
import type { IncomingMessage } from 'http';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const envPath = join(moduleDir, '.env');

if (existsSync(envPath)) {
  process.loadEnvFile?.(envPath);
}

export type GitInfo = {
  username: string | null;
  email: string | null;
  remoteUrl: string | null;
  githubUsername: string | null;
  repoName: string | null;
  branch: string | null;
  isGitRepo: boolean;
  error?: string;
};

export type SubmitReleaseRequest = {
  eventSlug?: string;
};

export type ChallengeInfoResponse = {
  challenge: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    submissionDeadline: string;
    votingDeadline: string;
  };
  now: string;
  windows: {
    submissionClosed: boolean;
    submissionOpen: boolean;
    votingStarted: boolean;
    votingEnded: boolean;
    votingOpen: boolean;
  };
};

export type SubmitReleaseResponse =
  | {
      success: true;
      tag: string;
      commitSha: string;
      branch: string;
      backend: {
        url: string;
        eventSlug: string;
      };
      release: {
        gameId: string;
        versionId: string;
        slug: string;
        versionNumber: number;
        created: boolean;
        diagnosticId: string | null;
      };
    }
  | {
      success: false;
      error: string;
      step: string;
      details?: unknown;
    };

const DEFAULT_EVENT_SLUG = '26-ar';
const DEFAULT_HACK_SITE_URL =
  process.env.HACK_SITE_URL?.trim().replace(/\/+$/, '') ||
  'https://hack.platan.us';
const DEFAULT_RELEASE_API_URL =
  process.env.ARCADE_RELEASE_API_URL ??
  `${DEFAULT_HACK_SITE_URL}/api/26/arcade/releases`;

export function getArcadeChallengeSlug() {
  return DEFAULT_EVENT_SLUG;
}

export function getArcadeChallengeInfoUrl() {
  const url = new URL('/api/26/arcade/challenge-info', DEFAULT_HACK_SITE_URL);
  url.searchParams.set('eventSlug', DEFAULT_EVENT_SLUG);
  return url.toString();
}

function parseGitHubRepo(remoteUrl: string) {
  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
  if (!match) {
    return {
      githubUsername: null,
      repoName: null,
      repoUrl: remoteUrl,
    };
  }

  return {
    githubUsername: match[1] ?? null,
    repoName: match[2] ?? null,
    repoUrl: `https://github.com/${match[1]}/${match[2]}`,
  };
}

function runGitCommand(command: string) {
  return execSync(command, {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function formatTimestampForTag(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export function getGitInfo(): GitInfo {
  try {
    const remoteUrl = runGitCommand('git config --get remote.origin.url');
    const username = runGitCommand('git config user.name');
    const email = runGitCommand('git config user.email');
    const branch = runGitCommand('git rev-parse --abbrev-ref HEAD');
    const parsedRepo = parseGitHubRepo(remoteUrl);

    return {
      username,
      email,
      remoteUrl: parsedRepo.repoUrl,
      githubUsername: parsedRepo.githubUsername,
      repoName: parsedRepo.repoName,
      branch,
      isGitRepo: true,
    };
  } catch (_error) {
    return {
      username: null,
      email: null,
      remoteUrl: null,
      githubUsername: null,
      repoName: null,
      branch: null,
      isGitRepo: false,
      error: 'Not a git repository or git not configured',
    };
  }
}

export async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf-8')) as T;
}

export async function submitArcadeRelease(
  payload: SubmitReleaseRequest,
): Promise<SubmitReleaseResponse> {
  const gitInfo = getGitInfo();

  if (!gitInfo.isGitRepo || !gitInfo.githubUsername || !gitInfo.repoName) {
    return {
      success: false,
      error: 'A GitHub repository with a configured origin remote is required.',
      step: 'validate_git',
      details: gitInfo,
    };
  }

  if (!gitInfo.branch || gitInfo.branch === 'HEAD') {
    return {
      success: false,
      error: 'Could not determine the current git branch.',
      step: 'detect_branch',
    };
  }

  const eventSlug = payload.eventSlug?.trim() || DEFAULT_EVENT_SLUG;

  try {
    runGitCommand('git add -A');
  } catch (error) {
    return {
      success: false,
      error: 'Failed to stage files for submission.',
      step: 'git_add',
      details: error instanceof Error ? error.message : 'unknown',
    };
  }

  const timestamp = formatTimestampForTag(new Date());
  const commitMessage = `Arcade release ${timestamp}`;

  try {
    runGitCommand(`git commit --allow-empty -m "${commitMessage}"`);
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create the release commit.',
      step: 'git_commit',
      details: error instanceof Error ? error.message : 'unknown',
    };
  }

  let commitSha: string;

  try {
    commitSha = runGitCommand('git rev-parse HEAD');
  } catch (error) {
    return {
      success: false,
      error: 'Failed to resolve the new commit SHA.',
      step: 'resolve_commit',
      details: error instanceof Error ? error.message : 'unknown',
    };
  }

  const shortSha = commitSha.slice(0, 7);
  const tag = `arcade-release-${timestamp}-${shortSha}`;

  try {
    runGitCommand(`git tag ${tag}`);
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create the release tag.',
      step: 'git_tag',
      details: error instanceof Error ? error.message : 'unknown',
    };
  }

  try {
    runGitCommand(`git push origin ${gitInfo.branch}`);
    runGitCommand(`git push origin ${tag}`);
  } catch (error) {
    return {
      success: false,
      error: 'Failed to push the commit and tag to origin.',
      step: 'git_push',
      details: error instanceof Error ? error.message : 'unknown',
    };
  }

  let response: Response;

  try {
    response = await fetch(DEFAULT_RELEASE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventSlug,
        githubUsername: gitInfo.githubUsername,
        repoName: gitInfo.repoName,
        tag,
      }),
    });
  } catch (error) {
    return {
      success: false,
      error: 'Failed to reach the arcade release API.',
      step: 'backend_request',
      details: error instanceof Error ? error.message : 'unknown',
    };
  }

  let result: unknown;

  try {
    result = await response.json();
  } catch (_error) {
    result = null;
  }

  if (!result || typeof result !== 'object') {
    return {
      success: false,
      error: 'Arcade release API returned an invalid response.',
      step: 'backend_response',
      details: result,
    };
  }

  const parsedResult = result as Record<string, unknown>;

  if (!response.ok || parsedResult.success !== true) {
    return {
      success: false,
      error:
        typeof parsedResult.error === 'string'
          ? parsedResult.error
          : 'Arcade release ingestion failed.',
      step:
        typeof parsedResult.stage === 'string'
          ? parsedResult.stage
          : 'backend_response',
      details: parsedResult,
    };
  }

  return {
    success: true,
    tag,
    commitSha,
    branch: gitInfo.branch,
    backend: {
      url: DEFAULT_RELEASE_API_URL,
      eventSlug,
    },
    release: {
      gameId: String(parsedResult.gameId),
      versionId: String(parsedResult.versionId),
      slug: String(parsedResult.slug),
      versionNumber: Number(parsedResult.versionNumber),
      created: Boolean(parsedResult.created),
      diagnosticId:
        parsedResult.diagnosticId == null
          ? null
          : String(parsedResult.diagnosticId),
    },
  };
}

export async function fetchArcadeChallengeInfo(): Promise<ChallengeInfoResponse> {
  const response = await fetch(getArcadeChallengeInfoUrl(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Challenge info request failed with ${response.status}`);
  }

  return (await response.json()) as ChallengeInfoResponse;
}
