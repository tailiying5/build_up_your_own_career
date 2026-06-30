/**
 * Batch convert output/resumes/*.md and output/cover-letters/*.md to PDF.
 * Uses marked to convert markdown → HTML, then generate-pdf.mjs for PDF rendering.
 * Usage: node md-to-pdf-batch.mjs
 */

import { readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));

const RESUME_DIR   = join(__dirname, 'output', 'resumes');
const COVER_DIR    = join(__dirname, 'output', 'cover-letters');
const PDF_OUT_DIR  = join(__dirname, 'output', 'pdfs');
const TEMP_HTML    = join(__dirname, 'output', '_temp_convert.html');

if (!existsSync(PDF_OUT_DIR)) mkdirSync(PDF_OUT_DIR, { recursive: true });

function mdToHtml(mdContent, title = '') {
  const body = marked.parse(mdContent);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @page { margin: 18px 36px; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10.5px;
    line-height: 1.45;
    color: #1a1a2e;
    max-width: 100%;
    margin: 0;
    padding: 0;
    background: #fff;
  }
  h1 { font-size: 20px; margin: 0 0 3px; color: #1a1a2e; }
  h2 {
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #1a7a8a;
    border-bottom: 1.5px solid #e2e2e2;
    padding-bottom: 2px;
    margin: 12px 0 6px;
  }
  h3 { font-size: 11px; font-weight: 700; margin: 8px 0 1px; }
  p  { margin: 3px 0 6px; }
  ul { margin: 3px 0 6px; padding-left: 16px; }
  li { margin-bottom: 2px; }
  hr { border: none; border-top: 1px solid #e2e2e2; margin: 8px 0; }
  em { font-style: italic; color: #555; }
  strong { font-weight: 700; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 10px; }
  th, td { text-align: left; padding: 3px 6px; border: 1px solid #ddd; }
  th { background: #f5f5f5; font-weight: 600; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function convertFile(mdPath, label, prefix = '') {
  const slug = basename(mdPath, '.md');
  const outPdf = join(PDF_OUT_DIR, prefix ? `${prefix}-${slug}.pdf` : `${slug}.pdf`);
  const mdContent = readFileSync(mdPath, 'utf8');
  const html = mdToHtml(mdContent, slug);

  writeFileSync(TEMP_HTML, html, 'utf8');
  try {
    execSync(`node "${join(__dirname, 'generate-pdf.mjs')}" "${TEMP_HTML}" "${outPdf}" --format=letter`, {
      stdio: 'pipe',
      cwd: __dirname,
    });
    console.log(`✅ ${label}: ${basename(outPdf)}`);
  } catch (e) {
    console.error(`❌ ${label} failed: ${e.message}`);
  }
}

import { readdirSync } from 'fs';

const resumes = readdirSync(RESUME_DIR).filter(f => f.endsWith('.md'));
const covers  = readdirSync(COVER_DIR).filter(f => f.endsWith('.md'));

console.log(`\nConverting ${resumes.length} resumes + ${covers.length} cover letters → output/pdfs/\n`);

for (const f of resumes) convertFile(join(RESUME_DIR, f),  `Resume  — ${f}`, 'resume');
for (const f of covers)  convertFile(join(COVER_DIR, f),  `Cover   — ${f}`, 'cover');

if (existsSync(TEMP_HTML)) unlinkSync(TEMP_HTML);

console.log(`\nDone. PDFs saved to: output/pdfs/`);
