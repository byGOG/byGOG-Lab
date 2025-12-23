import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveCopyValue,
  setCopyIconOnButton,
  copyToClipboard,
  COPY_ICON_SHAPES,
  WINUTIL_COMMAND
} from '../src/lib/copy-utils.js';

describe('copy-utils', () => {
  describe('resolveCopyValue', () => {
    it('returns copyText if present', () => {
      const link = { name: 'Test', copyText: 'custom command' };
      expect(resolveCopyValue(link)).toBe('custom command');
    });

    it('returns winutil command for winutil link', () => {
      const link = { name: 'Winutil', url: 'https://example.com' };
      expect(resolveCopyValue(link)).toBe(WINUTIL_COMMAND);
    });

    it('returns winutil command for christitus URL', () => {
      const link = { name: 'Other', url: 'https://christitus.com/win' };
      expect(resolveCopyValue(link)).toBe(WINUTIL_COMMAND);
    });

    it('returns empty string for regular links without copyText', () => {
      const link = { name: 'GitHub', url: 'https://github.com' };
      expect(resolveCopyValue(link)).toBe('');
    });

    it('handles null/undefined input', () => {
      expect(resolveCopyValue(null)).toBe('');
      expect(resolveCopyValue(undefined)).toBe('');
    });
  });

  describe('setCopyIconOnButton', () => {
    it('sets copy icon on button', () => {
      const btn = document.createElement('button');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      btn.appendChild(svg);
      
      setCopyIconOnButton(btn, 'copy');
      expect(svg.innerHTML).toBe(COPY_ICON_SHAPES.copy);
    });

    it('sets success icon', () => {
      const btn = document.createElement('button');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      btn.appendChild(svg);
      
      setCopyIconOnButton(btn, 'success');
      expect(svg.innerHTML).toBe(COPY_ICON_SHAPES.success);
    });

    it('sets error icon', () => {
      const btn = document.createElement('button');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      btn.appendChild(svg);
      
      setCopyIconOnButton(btn, 'error');
      expect(svg.innerHTML).toBe(COPY_ICON_SHAPES.error);
    });

    it('sets loading icon', () => {
      const btn = document.createElement('button');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      btn.appendChild(svg);
      
      setCopyIconOnButton(btn, 'loading');
      expect(svg.innerHTML).toBe(COPY_ICON_SHAPES.loading);
    });

    it('defaults to copy icon for unknown name', () => {
      const btn = document.createElement('button');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      btn.appendChild(svg);
      
      setCopyIconOnButton(btn, 'unknown');
      expect(svg.innerHTML).toBe(COPY_ICON_SHAPES.copy);
    });
  });

  describe('copyToClipboard', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('uses navigator.clipboard.writeText when available', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      const result = await copyToClipboard('test text');
      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('test text');
    });

    it('returns false when clipboard API fails and fallback fails', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Failed'));
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });
      
      // Mock execCommand to fail
      document.execCommand = vi.fn().mockReturnValue(false);

      const result = await copyToClipboard('test text');
      expect(result).toBe(false);
    });
  });

  describe('COPY_ICON_SHAPES', () => {
    it('contains all icon shapes', () => {
      expect(COPY_ICON_SHAPES.copy).toBeDefined();
      expect(COPY_ICON_SHAPES.success).toBeDefined();
      expect(COPY_ICON_SHAPES.error).toBeDefined();
      expect(COPY_ICON_SHAPES.loading).toBeDefined();
    });

    it('all shapes contain valid SVG paths/elements', () => {
      Object.values(COPY_ICON_SHAPES).forEach(shape => {
        expect(shape).toMatch(/<(rect|path|circle)/);
      });
    });
  });

  describe('WINUTIL_COMMAND', () => {
    it('is the expected PowerShell command', () => {
      expect(WINUTIL_COMMAND).toBe('irm "https://christitus.com/win" | iex');
    });
  });
});
