const fs = require('fs');
const path = require('path');

const summaryPath = path.resolve(__dirname, 'custom-report.json');
const outputPath = path.resolve(__dirname, 'custom-report.html');

if (!fs.existsSync(summaryPath)) {
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

function extractGroupMetrics(metrics) {
  const groupMap = {};
  for (const [metric, value] of Object.entries(metrics)) {
    const match = metric.match(/\{group:([^}]+)}/);
    if (match) {
      const group = match[1];
      if (!groupMap[group]) groupMap[group] = {};
      groupMap[group][metric.replace(/\{group:[^}]+}/, '')] = value;
    }
  }
  return groupMap;
}

function getMetricValue(metric, key) {
  return metric && metric.values && metric.values[key] !== undefined ? metric.values[key] : '-';
}

const groupMetrics = extractGroupMetrics(summary.metrics);
const now = new Date();
const formattedTime = now.toLocaleString();

// --- Summary Section ---
const vus = summary.metrics.vus?.values?.max ?? '-';
const duration = summary.state?.testRunDurationMs ? (summary.state.testRunDurationMs / 1000).toFixed(2) + 's' : '-';
const totalRequests = summary.metrics.http_reqs?.values?.count ?? '-';
const dataSent = summary.metrics.data_sent?.values?.count ?? '-';
const dataReceived = summary.metrics.data_received?.values?.count ?? '-';
const checks = summary.metrics.checks?.values?.passes ?? '-';
const fails = summary.metrics.checks?.values?.fails ?? '-';

let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>K6 Grouped Metrics Report</title>
  <link rel="stylesheet" href="https://unpkg.com/purecss@2.0.3/build/pure-min.css">
  <style>body{margin:2rem;}h2{margin-top:2rem;}table{width:100%;margin-bottom:2rem;} .summary-table td{padding:0.2rem 1rem;}</style>
</head>
<body>
  <h1>K6 Grouped Metrics Report</h1>
  <div style="color: #555; margin-bottom: 1.5rem;">Report generated: <b>${formattedTime}</b></div>
  <h2>Test Summary</h2>
  <table class="pure-table summary-table"><tbody>
    <tr><td><b>Duration</b></td><td>${duration}</td></tr>
    <tr><td><b>Max VUs</b></td><td>${vus}</td></tr>
    <tr><td><b>Total Requests</b></td><td>${totalRequests}</td></tr>
    <tr><td><b>Checks Passed</b></td><td>${checks}</td></tr>
    <tr><td><b>Checks Failed</b></td><td>${fails}</td></tr>
    <tr><td><b>Data Sent (bytes)</b></td><td>${dataSent}</td></tr>
    <tr><td><b>Data Received (bytes)</b></td><td>${dataReceived}</td></tr>
  </tbody></table>

  <h2>Overall Metrics</h2>
  <table class="pure-table pure-table-striped"><thead><tr><th>Metric</th><th>Count</th><th>Rate</th><th>Avg</th><th>Max</th><th>Min</th><th>p(90)</th><th>p(95)</th></tr></thead><tbody>`;
for (const [metric, val] of Object.entries(summary.metrics)) {
  if (metric.includes('{group:')) continue; // skip grouped metrics here
  html += `<tr><td>${metric}</td><td>${getMetricValue(val, 'count')}</td><td>${getMetricValue(val, 'rate')}</td><td>${getMetricValue(val, 'avg')}</td><td>${getMetricValue(val, 'max')}</td><td>${getMetricValue(val, 'min')}</td><td>${getMetricValue(val, 'p(90)')}</td><td>${getMetricValue(val, 'p(95)')}</td></tr>`;
}
html += '</tbody></table>';

// --- Per-group metrics ---
for (const [group, metrics] of Object.entries(groupMetrics)) {
  html += `<h2>Group: ${group}</h2>\n<table class="pure-table pure-table-striped"><thead><tr><th>Metric</th><th>Count</th><th>Avg</th><th>Max</th><th>Min</th><th>p(90)</th><th>p(95)</th></tr></thead><tbody>`;
  for (const [metric, val] of Object.entries(metrics)) {
    html += `<tr><td>${metric}</td><td>${val.values.count ?? '-'}</td><td>${val.values.avg ?? '-'}</td><td>${val.values.max ?? '-'}</td><td>${val.values.min ?? '-'}</td><td>${val.values['p(90)'] ?? '-'}</td><td>${val.values['p(95)'] ?? '-'}</td></tr>`;
  }
  html += '</tbody></table>';

  // Per-group thresholds
  let groupThresholds = Object.entries(metrics).filter(([_, val]) => val.thresholds);
  if (groupThresholds.length > 0) {
    html += '<h3>Thresholds</h3><table class="pure-table pure-table-striped"><thead><tr><th>Metric</th><th>Threshold</th><th>Status</th></tr></thead><tbody>';
    for (const [metric, val] of groupThresholds) {
      for (const [thresh, obj] of Object.entries(val.thresholds)) {
        html += `<tr><td>${metric}</td><td>${thresh}</td><td style="color:${obj.ok ? 'green':'red'}">${obj.ok ? 'OK':'FAILED'}</td></tr>`;
      }
    }
    html += '</tbody></table>';
  }
}

// --- Per-group checks ---
function renderChecksTable(group) {
  if (!group.checks || group.checks.length === 0) return '';
  let out = '<h3>Checks</h3><table class="pure-table pure-table-striped"><thead><tr><th>Name</th><th>Passes</th><th>Fails</th></tr></thead><tbody>';
  for (const check of group.checks) {
    out += `<tr><td>${check.name}</td><td>${check.passes}</td><td>${check.fails}</td></tr>`;
  }
  out += '</tbody></table>';
  return out;
}

if (summary.root_group && summary.root_group.groups) {
  for (const group of summary.root_group.groups) {
    html += `<h2>Checks for Group: ${group.name}</h2>`;
    html += renderChecksTable(group);
  }
}

html += '</body></html>';

fs.writeFileSync(outputPath, html);
