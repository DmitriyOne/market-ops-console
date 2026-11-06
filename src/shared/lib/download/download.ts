// Long enough for the browser to start reading the file (FileSaver.js waits 40 s).
const REVOKE_AFTER_MS = 40_000;

/**
 * Saves a file in the browser (no server round trip). The link is in the
 * page while clicked and the URL lives a while after: some browsers drop a
 * download from a detached link or a URL revoked at once.
 */
export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, REVOKE_AFTER_MS);
  }
}

export function downloadText(fileName: string, text: string, mime: string): void {
  downloadBlob(fileName, new Blob([text], { type: mime }));
}
