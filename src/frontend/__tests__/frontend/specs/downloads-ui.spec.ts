import { test, expect } from '../fixtures';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { assertDocxArchive, assertPdfDocument, extractDocxText, extractPdfText, inspectZipArchive } from '../../shared/binary-assertions';

const marker = 'Local fixture evidence 2026';
async function payload(format: string) {
  if (format === 'docx') {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${marker}</w:t></w:r></w:p></w:body></w:document>`);
    return zip.generateAsync({ type: 'nodebuffer' });
  }
  if (format === 'pdf') {
    const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
    pdf.addPage().drawText(marker, { x: 50, y: 700, font });
    return Buffer.from(await pdf.save());
  }
  const zip = new JSZip(); zip.file('report.md', `# Reporte\n\n${marker}\n`);
  return zip.generateAsync({ type: 'nodebuffer' });
}

test.describe('downloads', () => {
  const actions = [
    { suffix: 'analysis/codes', button: 'Exportar DOCX', type: 'codebook', format: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { suffix: 'analysis/codes', button: 'Exportar PDF', type: 'codebook', format: 'pdf', mime: 'application/pdf' },
    { suffix: 'report', button: 'Descargar paquete', type: 'bundle', format: 'zip', mime: 'application/zip' },
  ];
  for (const action of actions) {
    test(`${action.format} click downloads correct project target filename MIME and parsed fixture content`, { tag:'@crossbrowser-download' }, async ({ page, ui }) => {
      const bytes = await payload(action.format);
      const filename = `qa-evidence.${action.format}`;
      let observedFormat = '';
      let browserHeaders: Record<string, string> = {};
      const path = `/api/projects/${ui.projectId}/exports/${action.type}`;
      page.on('response', response => { if (new URL(response.url()).pathname === path) browserHeaders = response.headers(); });
      ui.mockApi.route('GET', path, ({ url }) => { observedFormat = url.searchParams.get('format') || ''; return { status: 200, body: bytes,
        headers: { 'content-type': action.mime, 'content-disposition': `attachment; filename="${filename}"`, 'cache-control': 'no-store' } }; });
      await page.goto(`/projects/${ui.projectId}/${action.suffix}`);
      // Attach listener before the actual export control, never substitute request.get.
      const downloaded = page.waitForEvent('download');
      await page.getByRole('button', { name: action.button, exact: true }).click();
      const download = await downloaded;
      expect(download.suggestedFilename()).toBe(filename);
      expect(await download.failure()).toBeNull();
      const stream = await download.createReadStream(); if (!stream) throw new Error('Download contains no readable browser payload');
      const chunks: Buffer[] = []; for await (const chunk of stream) chunks.push(Buffer.from(chunk));
      const received = Buffer.concat(chunks);
      expect(received.length).toBeGreaterThan(0);
      expect(received).toEqual(bytes);
      expect(observedFormat).toBe(action.format);
      expect(ui.requests.filter(r => r.method === 'GET' && r.path === path)).toHaveLength(1);
      if (action.format === 'docx') { await assertDocxArchive(received); expect(await extractDocxText(received)).toContain(marker); }
      else if (action.format === 'pdf') { expect((await assertPdfDocument(received)).pageCount).toBe(1); expect(await extractPdfText(received)).toContain(marker); }
      else { const archive = await inspectZipArchive(received, ['report.md']); expect(archive.markdown.get('report.md')).toContain(marker); }
      expect(browserHeaders['content-type']).toBe(action.mime);
      expect(browserHeaders['content-disposition']).toBe(`attachment; filename="${filename}"`);
    });
  }

  for (const [status, kind] of [[401, 'expired session'], [503, 'temporary failure'], [200, 'HTML instead of export']] as const) {
    test(`${kind} is visibly rejected and is not a valid download`, async ({ page, ui }) => {
      const path = `/api/projects/${ui.projectId}/exports/codebook`;
      ui.mockApi.route('GET', path, () => status === 200 ? { status, body: '<html><body>Export unavailable</body></html>', headers: { 'content-type': 'text/html' } } : { status, json: { ok: false, error: status === 401 ? 'UNAUTHORIZED' : 'DEPENDENCY_UNAVAILABLE' } });
      await page.goto(`/projects/${ui.projectId}/analysis/codes`);
      const downloads: string[] = [];
      page.on('download', download => { downloads.push(download.suggestedFilename()); });
      await page.getByRole('button', { name: 'Exportar DOCX', exact: true }).click();
      await expect.poll(() => ui.requests.find(r => r.method === 'GET' && r.path === path)?.status).toBe(status);
      await expect(page.getByText(/No se pudo.*export|descarga.*fall|export.*no disponible|Export unavailable|UNAUTHORIZED|DEPENDENCY_UNAVAILABLE/i).filter({ visible: true }).first()).toBeVisible();
      expect(downloads).toHaveLength(0);
      // A JSON navigation response is not an application-controlled recoverable error.
      await expect(page.getByRole('heading', { name: 'Codificación', exact: true })).toBeVisible();
    });
  }
});
