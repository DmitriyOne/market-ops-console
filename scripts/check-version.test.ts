import { describe, expect, it } from 'vitest';

import { checkVersions } from './check-version';

const pkg = (version: string) => JSON.stringify({ name: 'x', version });
const changelog = (version: string) =>
  `# Changelog\n\nIntro.\n\n## [${version}] - Unreleased\n\n### Added\n- x\n\n## [0.1.0] - 2026-11-03\n`;

describe('checkVersions', () => {
  it('passes when package, changelog and release branch agree', () => {
    expect(
      checkVersions({
        packageJson: pkg('0.2.0'),
        changelog: changelog('0.2.0'),
        branch: 'release/0.2.0',
      }),
    ).toEqual({ ok: true, version: '0.2.0' });
  });

  it('fails when the changelog top entry differs, naming both versions', () => {
    const result = checkVersions({ packageJson: pkg('0.2.0'), changelog: changelog('0.1.0') });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('0.2.0');
      expect(result.reason).toContain('0.1.0');
    }
  });

  it('fails when the release branch number differs', () => {
    const result = checkVersions({
      packageJson: pkg('0.2.0'),
      changelog: changelog('0.2.0'),
      branch: 'release/0.3.0',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('0.3.0');
  });

  it('compares only package and changelog on a non-release branch', () => {
    expect(
      checkVersions({
        packageJson: pkg('0.2.0'),
        changelog: changelog('0.2.0'),
        branch: 'develop',
      }),
    ).toEqual({ ok: true, version: '0.2.0' });
  });

  it('fails when the changelog has no version heading', () => {
    expect(checkVersions({ packageJson: pkg('0.2.0'), changelog: '# Changelog\n' }).ok).toBe(false);
  });

  it('fails when package.json has no version', () => {
    expect(checkVersions({ packageJson: '{}', changelog: changelog('0.2.0') }).ok).toBe(false);
  });
});
