import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadBlob } from './download';

const revokeObjectURL = vi.fn();

describe('downloadBlob', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    revokeObjectURL.mockReset();
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:file'), revokeObjectURL });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('clicks a link that is in the page, then removes it', () => {
    let attached = false;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      attached = this.isConnected;
      expect(this.download).toBe('a.csv');
      expect(this.href).toBe('blob:file');
    });
    downloadBlob('a.csv', new Blob(['x']));
    expect(click).toHaveBeenCalledOnce();
    expect(attached).toBe(true);
    expect(document.querySelector('a[download]')).toBeNull();
    click.mockRestore();
  });

  it('frees the file URL later, not at once (some browsers drop the download)', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadBlob('a.csv', new Blob(['x']));
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:file');
    click.mockRestore();
  });
});
