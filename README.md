# K6 Load Testing Repository

This repository contains everything you need for k6 load testing, including:
- Example k6 test scripts
- Custom grouped HTML report generator
- Instructions for using both the built-in k6 dashboard and custom reporting

## Getting Started

### 1. Install k6
See https://k6.io/docs/getting-started/installation/ for instructions.

### 2. Example Test Script
- `k6Test.js`: Example k6 script with group-based metrics and summary reporting.

### 3. Custom Grouped Report
- `generate-grouped-report.cjs`: Node.js script to generate a grouped HTML report from `custom-report.json`.
- Run your test with:
  ```
  k6 run k6Test.js
  ```
- This will generate `custom-report.html` (custom HTML report) and `custom-report.json` (raw summary data).
- Then run:
  ```
  node generate-grouped-report.cjs
  ```
- Open `grouped-summary.html` in your browser for a detailed, grouped report.

### 4. Built-in k6 Dashboard
- To use the built-in dashboard:
  ```
  K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-report.html k6 run k6Test.js
  ```
- Open `html-report.html` for the interactive dashboard (this is the built-in k6 report).

### 5. Customization
- Edit `k6Test.js` to add your own test logic.
- Edit `generate-grouped-report.cjs` to change report formatting or add more details.

## Project Structure
- `k6Test.js` - Example k6 test
- `custom-report.html` - Custom HTML report (from k6-reporter)
- `custom-report.json` - Raw summary data (for custom scripts)
- `generate-grouped-report.cjs` - Custom grouped HTML report generator
- `grouped-summary.html` - Grouped HTML report (from custom script)
- `html-report.html` - Built-in k6 dashboard report
- `README.md` - This file

---
For more info, see the [k6 documentation](https://k6.io/docs/).
