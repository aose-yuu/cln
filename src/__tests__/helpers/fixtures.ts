/**
 * Test fixtures and data generators
 */

import type { Repository, ClonedRepository, Settings } from '../../types.js';

/**
 * Create a test repository
 */
export const createTestRepository = (
  overrides?: Partial<Repository>
): Repository => ({
  name: 'test-repo',
  url: 'https://github.com/test/repo.git',
  ...overrides
});

/**
 * Create a test cloned repository
 */
export const createTestClonedRepository = (
  overrides?: Partial<ClonedRepository>
): ClonedRepository => ({
  repository: 'test-repo',
  branch: 'main',
  path: '/home/user/works/cln/test-repo/main',
  ...overrides
});

/**
 * Create test settings
 */
export const createTestSettings = (
  overrides?: Partial<Settings>
): Settings => ({
  outDir: '/home/user/works',
  repositories: {
    'test-repo': 'https://github.com/test/repo.git',
    'another-repo': 'https://github.com/test/another.git'
  },
  ...overrides
});

/**
 * Generate multiple test repositories
 */
export const generateTestRepositories = (count: number): Repository[] => {
  return Array.from({ length: count }, (_, i) => ({
    name: `repo-${i}`,
    url: `https://github.com/test/repo-${i}.git`
  }));
};

/**
 * Generate test branches
 */
export const generateTestBranches = (
  repoName: string,
  branches: string[]
): ClonedRepository[] => {
  return branches.map(branch => ({
    repository: repoName,
    branch,
    path: `/home/user/works/cln/${repoName}/${branch}`
  }));
};

/**
 * Test URLs for validation
 */
export const testUrls = {
  valid: [
    'https://github.com/user/repo.git',
    'git@github.com:user/repo.git',
    'ssh://git@github.com/user/repo.git',
    'https://gitlab.com/user/repo.git',
    'https://bitbucket.org/user/repo.git'
  ],
  invalid: [
    'file:///etc/passwd',
    'ftp://example.com/repo.git',
    '../../../etc/passwd',
    'https://github.com/user/repo.git; rm -rf /',
    'git@github.com:user/repo.git$(whoami)'
  ]
};

/**
 * Test repository names
 */
export const testRepositoryNames = {
  valid: [
    'my-repo',
    'my_repo',
    'myrepo123',
    'repo',
    'a'
  ],
  invalid: [
    '',
    '   ',
    '../evil',
    '../../etc/passwd',
    'repo$name',
    'repo;rm -rf /',
    'repo`whoami`',
    'a'.repeat(101)
  ]
};

/**
 * Test branch names
 */
export const testBranchNames = {
  valid: [
    'main',
    'develop',
    'feature/new-feature',
    'bugfix/issue-123',
    'release/v1.0.0'
  ],
  invalid: [
    '',
    '../../../etc',
    'feature/../../../passwd',
    'feature;rm -rf',
    'branch$(whoami)',
    'HEAD',
    'FETCH_HEAD'
  ]
};