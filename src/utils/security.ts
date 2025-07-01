import { URL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Validates and sanitizes repository names to prevent path traversal
 */
export function sanitizeRepositoryName(name: string): string {
  // Remove any path traversal attempts and special characters
  const sanitized = name
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '') // Note: Keep the - character last to avoid regex range
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
    .replace(/[^a-zA-Z0-9_/-]/g, '') // Note: Keep the - character last
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
  
  // Additional security checks first
  if (trimmedUrl.includes('..') || 
      trimmedUrl.includes('$') || 
      trimmedUrl.includes('`') ||
      trimmedUrl.includes(';') ||
      trimmedUrl.includes('|') ||
      trimmedUrl.includes('&') ||
      trimmedUrl.includes('\n') ||
      trimmedUrl.includes('\r')) {
    throw new Error('URL contains potentially dangerous characters');
  }
  
  // Check for common Git URL patterns
  const gitUrlPatterns = [
    /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!'+,=]+$/,  // Removed semicolon and other dangerous chars
    /^git@[a-zA-Z0-9\-._]+:[a-zA-Z0-9\-._/]+\.git$/,
    /^ssh:\/\/[a-zA-Z0-9\-._~:/?#[\]@!'+,=]+$/,
    /^[a-zA-Z0-9\-._]+:[a-zA-Z0-9\-._/]+\.git$/
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
      // If we got here, it's a valid http(s) URL but doesn't match Git patterns
      // This is okay for some Git hosting services
    } catch {
      throw new Error('Invalid Git repository URL');
    }
  } else {
    // Even if it matches a pattern, check protocol for safety
    if (trimmedUrl.startsWith('file://') || trimmedUrl.startsWith('ftp://')) {
      throw new Error('Invalid protocol');
    }
  }
  
  return trimmedUrl;
}

/**
 * Creates a secure temporary file path with proper permissions
 */
export function createSecureTempPath(prefix: string = 'cln'): string {
  const randomSuffix = randomBytes(16).toString('hex');
  const filename = `${prefix}_${process.pid}_${Date.now()}_${randomSuffix}`;
  return join(tmpdir(), filename);
}

/**
 * Validates a file path to ensure it's within expected boundaries
 */
export function validatePath(path: string, basePath: string): boolean {
  const normalizedPath = join(path);
  const normalizedBase = join(basePath);
  
  // Ensure the path is within the base directory
  return normalizedPath.startsWith(normalizedBase);
}

/**
 * Sanitizes error messages to prevent information disclosure
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove file paths and sensitive information from error messages
    const message = error.message
      .replace(/https?:\/\/[^\s]+/g, '[url]')  // URLs first
      .replace(/git@[^\s]+/g, '[repository]')
      .replace(/\/[^\s]+/g, '[path]')
      .replace(/\b[A-Za-z]:\\[^\s]+/g, '[path]');
    
    return message;
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