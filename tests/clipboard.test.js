import { describe, it, expect, beforeEach, vi } from 'vitest';
import { copyToClipboard } from '../src/lib/clipboard.js';

describe('clipboard', () => {
  beforeEach(() => {
    // Reset mocks
    vi.restoreAllMocks();
  });

  describe('copyToClipboard', () => {
    it('modern Clipboard API ile kopyalar', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      const result = await copyToClipboard('test text');
      
      expect(writeTextMock).toHaveBeenCalledWith('test text');
      expect(result).toBe(true);
    });

    it('Clipboard API yoksa fallback kullanır', async () => {
      // Remove clipboard API
      Object.assign(navigator, { clipboard: undefined });
      
      // Mock execCommand
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      const result = await copyToClipboard('fallback test');
      
      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(result).toBe(true);
    });
  });
});
