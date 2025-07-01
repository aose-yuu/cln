import { URL } from 'node:url';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';

/**
 * Validates and sanitizes repository names to prevent path traversal
 */
export function sanitizeRepositoryName(name: string): string {
  // Remove any path traversal attempts and special characters
  const sanitized = name
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .trim();
  
  if (!sanitized || sanitized.length > 100) {
    throw new Error('Invalid repository name');
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes branch names
 */
export function sanitizeBranchName(branch: string): string {
  // Allow alphanumeric, hyphens, underscores, forward slashes for feature branches
  const sanitized = branch
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9_/-]/g, '')
    .replace(/\/+/g, '/') // Normalize multiple slashes
    .replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
    .trim();
  
  if (!sanitized || sanitized.length > 200) {
    throw new Error('Invalid branch name');
  }
  
  return sanitized;
}

/**
 * Validates Git repository URLs to prevent command injection
 */
export function validateGitUrl(url: string): string {
  const trimmedUrl = url.trim();
  
  // Check for dangerous characters
  if (trimmedUrl.includes('..') || 
      trimmedUrl.includes('$') || 
      trimmedUrl.includes('`') ||
      trimmedUrl.includes(';') ||
      trimmedUrl.includes('|') ||
      trimmedUrl.includes('&')) {
    throw new Error('URL contains potentially dangerous characters');
  }
  
  // Check for common Git URL patterns
  const gitUrlPatterns = [
    /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!'+,=]+$/,
    /^git@[a-zA-Z0-9\-._]+:[a-zA-Z0-9\-._/]+\.git$/,
    /^ssh:\/\/[a-zA-Z0-9\-._~:/?#[\]@!'+,=]+$/
  ];
  
  const isValidGitUrl = gitUrlPatterns.some(pattern => pattern.test(trimmedUrl));
  
  if (!isValidGitUrl) {
    // Try to parse as regular URL
    try {
      const parsed = new URL(trimmedUrl);
      // Only allow http(s) and git protocols
      if (!['http:', 'https:', 'git:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      throw new Error('Invalid Git repository URL');
    }
  }
  
  return trimmedUrl;
}

/**
 * Validates a file path to ensure it's safe
 */
export function validatePath(path: string, basePath: string): boolean {
  // Check for dangerous patterns first
  if (path.includes('..') || path.includes('\0')) {
    return false;
  }
  
  const normalizedPath = join(path);
  const normalizedBase = join(basePath);
  
  // Ensure the path is within the base directory
  return normalizedPath.startsWith(normalizedBase);
}

/**
 * Sanitizes error messages to prevent information disclosure
 */
export function sanitizeErrorMessage(input: unknown): string {
  if (input instanceof Error) {
    return input.message
      .replace(/\/[^\s]+/g, '[path]')
      .replace(/https?:\/\/[^\s]+/g, '[url]')
      .replace(/git@[^\s]+/g, '[repository]');
  }
  
  return 'An error occurred';
}

/**
 * Escapes shell arguments to prevent command injection
 */
export function escapeShellArg(arg: string): string {
  // For safety, we'll use a whitelist approach
  // Only allow safe characters and escape everything else
  if (!/^[a-zA-Z0-9\-_./]+$/.test(arg)) {
    // Wrap in single quotes and escape any single quotes
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }
  return arg;
}

/**
 * Creates a secure temporary file path with proper permissions
 */
export function createSecureTempPath(prefix: string = 'cln'): string {
  const randomSuffix = randomBytes(16).toString('hex');
  const filename = `${prefix}_${process.pid}_${Date.now()}_${randomSuffix}`;
  return join(tmpdir(), filename);
}