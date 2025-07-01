export interface Repository {
  name: string;
  url: string;
}

export interface Settings {
  outDir: string;
  repositories: Record<string, string>;
}

export interface ClonedRepository {
  repository: string;
  branch: string;
  path: string;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  error?: string;
  path?: string;
}