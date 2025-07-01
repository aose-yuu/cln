import { execa } from 'execa';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import type { CommandResult, ClonedRepository } from '../types.js';
import { loadSettings, expandPath } from './settings.js';
import { 
  validateGitUrl, 
  sanitizeRepositoryName, 
  sanitizeBranchName, 
  validatePath,
  sanitizeErrorMessage,
  escapeShellArg 
} from './security.js';

export async function cloneRepository(
  repoUrl: string,
  targetPath: string,
  branch?: string
): Promise<CommandResult> {
  try {
    // Validate inputs to prevent command injection
    const validatedUrl = validateGitUrl(repoUrl);
    
    // Ensure target path is safe
    const settings = await loadSettings();
    const baseDir = expandPath(settings.outDir);
    if (!validatePath(targetPath, baseDir)) {
      throw new Error('Invalid target path');
    }
    
    const args = ['clone'];
    
    // Use validated and escaped arguments
    args.push(escapeShellArg(validatedUrl));
    args.push(escapeShellArg(targetPath));
    
    if (branch) {
      const sanitizedBranch = sanitizeBranchName(branch);
      args.push('-b', escapeShellArg(sanitizedBranch));
    }
    
    await execa('git', args, { shell: false });
    
    return {
      success: true,
      message: `Successfully cloned repository to ${targetPath}`,
      path: targetPath
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error)
    };
  }
}

export async function getClonePath(repoName: string, branchName: string): Promise<string> {
  const settings = await loadSettings();
  const outDir = expandPath(settings.outDir);
  
  // Sanitize inputs to prevent path traversal
  const sanitizedRepo = sanitizeRepositoryName(repoName);
  const sanitizedBranch = sanitizeBranchName(branchName);
  
  return join(outDir, 'cln', sanitizedRepo, sanitizedBranch);
}

export async function ensureParentDirectory(path: string): Promise<void> {
  // Use dirname instead of '..' to avoid symlink issues
  const parentDir = dirname(path);
  await fs.mkdir(parentDir, { recursive: true });
}

export async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await fs.stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function listClonedRepositories(): Promise<ClonedRepository[]> {
  const settings = await loadSettings();
  const baseDir = join(expandPath(settings.outDir), 'cln');
  const repositories: ClonedRepository[] = [];
  
  try {
    const repos = await fs.readdir(baseDir);
    
    for (const repo of repos) {
      const repoPath = join(baseDir, repo);
      const stats = await fs.stat(repoPath);
      
      if (stats.isDirectory()) {
        const branches = await fs.readdir(repoPath);
        
        for (const branch of branches) {
          const branchPath = join(repoPath, branch);
          const branchStats = await fs.stat(branchPath);
          
          if (branchStats.isDirectory()) {
            repositories.push({
              repository: repo,
              branch,
              path: branchPath
            });
          }
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist yet
  }
  
  return repositories;
}

export async function removeDirectory(path: string): Promise<CommandResult> {
  try {
    // Validate that the path is within our managed directory
    const settings = await loadSettings();
    const baseDir = join(expandPath(settings.outDir), 'cln');
    
    if (!validatePath(path, baseDir)) {
      throw new Error('Cannot remove directory outside of managed area');
    }
    
    // Additional check to ensure we're not deleting the base directory itself
    if (path === baseDir) {
      throw new Error('Cannot remove base directory');
    }
    
    await fs.rm(path, { recursive: true, force: true });
    return {
      success: true,
      message: `Successfully removed ${path}`
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeErrorMessage(error)
    };
  }
}