import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configCommandAction } from '../../commands/config.js';
import * as settings from '../../utils/settings.js';

vi.mock('../../utils/settings.js', () => ({
  getSettingsPath: vi.fn()
}));

describe('config command', () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should display the settings file path', async () => {
    const mockSettingsPath = '/home/user/.config/cln/settings.json';
    vi.mocked(settings.getSettingsPath).mockReturnValue(mockSettingsPath);

    await configCommandAction();

    expect(settings.getSettingsPath).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Settings file:'),
      mockSettingsPath
    );
  });
});