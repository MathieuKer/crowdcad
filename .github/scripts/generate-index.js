#!/usr/bin/env node

/**
 * Scans the gh-pages output directory for Playwright report folders
 * structured as <branch>/<sha>/index.html and generates a root index.html
 * listing all reports, sorted by most recent first.
 *
 * Usage: node .github/scripts/generate-index.js <gh-pages-dir> <base-url>
 * Example: node .github/scripts/generate-index.js ./report https://org.github.io/repo
 */

const fs   = require("fs");
const path = require("path");

const [pagesDir, baseUrl] = process.argv.slice(2);

if (!pagesDir || !baseUrl) {
  console.error("Usage: generate-index.js <gh-pages-dir> <base-url>");
  process.exit(1);
}

// Collect all branch/sha pairs that contain an index.html
const reports = [];

for (const branch of fs.readdirSync(pagesDir)) {
  const branchPath = path.join(pagesDir, branch);
  if (!fs.statSync(branchPath).isDirectory()) continue;

  for (const sha of fs.readdirSync(branchPath)) {
    const reportIndex = path.join(branchPath, sha, "index.html");
    if (fs.existsSync(reportIndex)) {
      const stat = fs.statSync(path.join(branchPath, sha));
      reports.push({ branch, sha, mtime: stat.mtimeMs });
    }
  }
}

// Sort most recent first
reports.sort((a, b) => b.mtime - a.mtime);

const rows = reports
  .map(
    ({ branch, sha }) => `
      <tr>
        <td>${branch}</td>
        <td class="sha"><a href="${baseUrl}/${branch}/${sha}/" target="_blank">${sha}</a></td>
        <td><a href="${baseUrl}/${branch}/${sha}/" target="_blank">View report →</a></td>
      </tr>`
  )
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Playwright Reports</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      max-width: 860px;
      margin: 48px auto;
      padding: 0 24px;
      color: #1f2328;
      background: #ffffff;
    }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 4px; }
    p.subtitle { color: #6b7280; font-size: 0.875rem; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th {
      text-align: left;
      padding: 8px 12px;
      border-bottom: 2px solid #e5e7eb;
      color: #6b7280;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f9fafb; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .sha { font-family: ui-monospace, monospace; color: #6b7280; }
    .empty { text-align: center; padding: 40px; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>📊 Playwright Test Reports</h1>
  <p class="subtitle">${reports.length} report${reports.length !== 1 ? "s" : ""} — most recent first</p>
  <table>
    <thead>
      <tr>
        <th>Branch</th>
        <th>Commit</th>
        <th>Report</th>
      </tr>
    </thead>
    <tbody>
      ${reports.length ? rows : '<tr><td colspan="3" class="empty">No reports yet.</td></tr>'}
    </tbody>
  </table>
</body>
</html>
`;

const outPath = path.join(pagesDir, "index.html");
fs.writeFileSync(outPath, html, "utf8");
console.log(`✅ index.html written → ${outPath} (${reports.length} reports)`);
