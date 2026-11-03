// Version gate for CI (ADR 0007): package.json version = top CHANGELOG entry
// = release branch number. Runs on Node 24 type stripping, no dependencies.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export type CheckInput = { packageJson: string; changelog: string; branch?: string };
export type CheckResult = { ok: true; version: string } | { ok: false; reason: string };

const CHANGELOG_HEADING = /^## \[(\d+\.\d+\.\d+)\]/m;
const RELEASE_BRANCH = /^release\/(\d+\.\d+\.\d+)$/;

function packageVersion(packageJson: string): string | undefined {
  const parsed: unknown = JSON.parse(packageJson);
  if (typeof parsed === 'object' && parsed !== null && 'version' in parsed) {
    return typeof parsed.version === 'string' ? parsed.version : undefined;
  }
  return undefined;
}

export function checkVersions({ packageJson, changelog, branch }: CheckInput): CheckResult {
  const version = packageVersion(packageJson);
  if (!version) return { ok: false, reason: 'package.json has no "version".' };

  const top = CHANGELOG_HEADING.exec(changelog)?.[1];
  if (!top) return { ok: false, reason: 'CHANGELOG.md has no "## [x.y.z]" heading.' };
  if (top !== version) {
    return {
      ok: false,
      reason: `package.json is ${version} but the top CHANGELOG.md entry is ${top}.`,
    };
  }

  const branchVersion = branch ? RELEASE_BRANCH.exec(branch)?.[1] : undefined;
  if (branchVersion && branchVersion !== version) {
    return {
      ok: false,
      reason: `Branch ${String(branch)} is ${branchVersion} but package.json is ${version}.`,
    };
  }
  return { ok: true, version };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = checkVersions({
    packageJson: readFileSync('package.json', 'utf8'),
    changelog: readFileSync('CHANGELOG.md', 'utf8'),
    branch: process.env.GITHUB_HEAD_REF,
  });
  if (result.ok) {
    console.log(`Version check passed: ${result.version}`);
  } else {
    console.error(`Version check failed: ${result.reason}`);
    process.exit(1);
  }
}
