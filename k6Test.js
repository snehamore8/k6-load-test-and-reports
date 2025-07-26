import http from 'k6/http';
import { check, group } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export let options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    'http_req_duration{group:Get Posts}': ['p(95)<500'],
    'http_req_duration{group:Create Post}': ['p(95)<1000'],
  },
};

export default function () {
  group('Get Posts', function () {
    let res = http.get('https://jsonplaceholder.typicode.com/posts', {
      tags: { group: 'Get Posts' },
    });
    check(res, {
      'Get Posts - status is 200': (r) => r.status === 200,
      'Get Posts - has JSON array': (r) => Array.isArray(r.json()),
    });
  });

  group('Create Post', function () {
    let payload = JSON.stringify({
      title: 'foo',
      body: 'bar',
      userId: 1,
    });

    let headers = { 'Content-Type': 'application/json' };

    let res = http.post('https://jsonplaceholder.typicode.com/posts', payload, {
      headers,
      tags: { group: 'Create Post' },
    });

    check(res, {
      'Create Post - status is 201': (r) => r.status === 201,
      'Create Post - response has ID': (r) => r.json().id !== undefined,
    });
  });
}

// Generate HTML and JSON report after the test run
export function handleSummary(data) {
  return {
    'custom-report.html': htmlReport(data),
    'custom-report.json': JSON.stringify(data, null, 2),
  };
}
