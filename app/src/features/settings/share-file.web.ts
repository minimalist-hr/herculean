/** On the web, a ZIP downloads instead. */
export function shareFile(name: string, bytes: Uint8Array<ArrayBuffer>) {
  const url = URL.createObjectURL(
    new Blob([bytes], { type: 'application/zip' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);

  return Promise.resolve();
}
