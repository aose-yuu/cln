import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { action } from '../../commands/setup.js';
import * as fs from 'fs';
import { loadSettings, saveSettings, getSettingsPath } from '../../utils/settings.js';

// Mock dependencies
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('picocolors', () => ({
  default: {
    green: (str: string) => str,
    red: (str: string) => str,
    yellow: (str: string) => str,
    cyan: (str: string) => str,
    gray: (str: string) => str,
    bold: (str: string) => str,
    white: (str: string) => str,
  },
}));

vi.mock('prompts');
vi.mock('fs');
vi.mock('../../utils/settings.js');
vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/user'),
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
}));

import prompts from 'prompts';

describe('setup command', () => {
  const mockHomedir = '/home/user';
  const mockShell = '/bin/bash';
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.SHELL = mockShell;
    vi.mocked(getSettingsPath).mockReturnValue('/home/user/.config/cln/settings.json');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SHELL;
  });

  it('should set default output directory to ~/cln', async () => {
    const mockSettings = {
      outDir: `${mockHomedir}/works`,
      repositories: {},
    };
    
    vi.mocked(loadSettings).mockResolvedValue(mockSettings);
    vi.mocked(saveSettings).mockResolvedValue(undefined);
    
    vi.mocked(prompts).mockResolvedValueOnce({ installShell: false });
    
    await action();
    
    expect(saveSettings).toHaveBeenCalledWith({
      ...mockSettings,
      outDir: `${mockHomedir}/cln`,
    });
  });

  it('should detect bash shell and install integration', async () => {
    const mockSettings = {
      outDir: `${mockHomedir}/works`,
      repositories: {},
    };
    
    vi.mocked(loadSettings).mockResolvedValue(mockSettings);
    vi.mocked(saveSettings).mockResolvedValue(undefined);
    
    vi.mocked(prompts).mockResolvedValueOnce({ installShell: true });
    
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.appendFileSync).mockImplementation(() => {});
    
    await action();
    
    // Check that shell function was appended
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      `${mockHomedir}/.bashrc`,
      expect.stringContaining('CLN Shell Integration'),
    );
  });

  it('should detect zsh shell', async () => {
    process.env.SHELL = '/bin/zsh';
    
    const mockSettings = {
      outDir: `${mockHomedir}/works`,
      repositories: {},
    };
    
    vi.mocked(loadSettings).mockResolvedValue(mockSettings);
    vi.mocked(saveSettings).mockResolvedValue(undefined);
    
    vi.mocked(prompts).mockResolvedValueOnce({ installShell: true });
    
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.appendFileSync).mockImplementation(() => {});
    
    await action();
    
    // Check that shell function was appended to zshrc
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      `${mockHomedir}/.zshrc`,
      expect.stringContaining('CLN Shell Integration'),
    );
  });

  it('should detect fish shell and create function file', async () => {
    process.env.SHELL = '/usr/bin/fish';
    
    const mockSettings = {
      outDir: `${mockHomedir}/works`,
      repositories: {},
    };
    
    vi.mocked(loadSettings).mockResolvedValue(mockSettings);
    vi.mocked(saveSettings).mockResolvedValue(undefined);
    
    vi.mocked(prompts).mockResolvedValueOnce({ installShell: true });
    
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.appendFileSync).mockImplementation(() => {});
    
    await action();
    
    // Check that fish function file was created
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      `${mockHomedir}/.config/fish/functions/cln.fish`,
      expect.stringContaining('CLN Shell Integration'),
    );
  });

  it('should handle existing integration', async () => {
    const mockSettings = {
      outDir: `${mockHomedir}/works`,
      repositories: {},
    };
    
    vi.mocked(loadSettings).mockResolvedValue(mockSettings);
    vi.mocked(saveSettings).mockResolvedValue(undefined);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('# CLN Shell Integration\n# Existing content');
    
    vi.mocked(prompts).mockResolvedValueOnce({ installShell: true });
    
    await action();
    
    // Should not append anything
    expect(fs.appendFileSync).not.toHaveBeenCalled();
    
    // Should show warning
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Shell function already installed')
    );
  });

  it('should handle setup cancellation', async () => {
    const mockSettings = {
      outDir: `${mockHomedir}/works`,
      repositories: {},
    };
    
    vi.mocked(loadSettings).mockResolvedValue(mockSettings);
    vi.mocked(saveSettings).mockResolvedValue(undefined);
    
    // User cancels at installShell prompt
    vi.mocked(prompts).mockResolvedValueOnce({ installShell: undefined });
    
    await action();
    
    // Note: saveSettings is called once to set the default ~/cln directory
    expect(saveSettings).toHaveBeenCalledOnce();
    expect(saveSettings).toHaveBeenCalledWith({
      ...mockSettings,
      outDir: `${mockHomedir}/cln`,
    });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Setup cancelled')
    );
  });

  it('should handle unknown shell', async () => {
    process.env.SHELL = '/bin/unknown';
    
    const mockSettings = {
      outDir: `${mockHomedir}/works`,
      repositories: {},
    };
    
    vi.mocked(loadSettings).mockResolvedValue(mockSettings);
    vi.mocked(saveSettings).mockResolvedValue(undefined);
    
    vi.mocked(prompts).mockResolvedValueOnce({ installShell: true });
    
    await action();
    
    // Should show warning about unknown shell
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Unknown shell')
    );
  });

  it('should handle file write errors gracefully', async () => {
    const mockSettings = {
      outDir: `${mockHomedir}/works`,
      repositories: {},
    };
    
    vi.mocked(loadSettings).mockResolvedValue(mockSettings);
    vi.mocked(saveSettings).mockResolvedValue(undefined);
    
    vi.mocked(prompts).mockResolvedValueOnce({ installShell: true });
    
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.appendFileSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });
    
    await action();
    
    // Should show error message
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Could not write to')
    );
  });

  it('should not prompt for shell when user declines', async () => {
    const mockSettings = {
      outDir: `${mockHomedir}/works`,
      repositories: {},
    };
    
    vi.mocked(loadSettings).mockResolvedValue(mockSettings);
    vi.mocked(saveSettings).mockResolvedValue(undefined);
    
    vi.mocked(prompts).mockResolvedValueOnce({ installShell: false });
    
    await action();
    
    // Should not try to install shell function
    expect(fs.appendFileSync).not.toHaveBeenCalled();
    expect(fs.existsSync).not.toHaveBeenCalled();
  });
});