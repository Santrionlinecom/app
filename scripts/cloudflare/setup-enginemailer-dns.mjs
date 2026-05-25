#!/usr/bin/env node

const API_BASE = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = 'santrionline.com';
const AUTO_TTL = 1;
const APPLY = process.env.APPLY_DNS === '1';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN?.trim();

const TARGET_SPF = 'v=spf1 include:enginemailer.org include:_spf.mx.cloudflare.net ~all';

const CNAME_TARGETS = [
  {
    name: 'em1._domainkey.santrionline.com',
    content: 'dkim1.enginemailer.org'
  },
  {
    name: 'em2._domainkey.santrionline.com',
    content: 'dkim2.enginemailer.org'
  },
  {
    name: '_dmarc.santrionline.com',
    content: '_dmarc.enginemailer.org'
  }
];

function requireToken() {
  if (TOKEN) return;

  throw new Error(
    [
      'Missing CLOUDFLARE_API_TOKEN.',
      'Run this in your local terminal first:',
      'export CLOUDFLARE_API_TOKEN=your_cloudflare_api_token'
    ].join('\n')
  );
}

function normalizeName(value) {
  return value.toLowerCase().replace(/\.$/, '');
}

function normalizeDnsContent(value) {
  return value.trim().replace(/\.$/, '');
}

function normalizeTxtContent(value) {
  return value.trim().replace(/^"|"$/g, '');
}

async function cfFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || body?.success === false) {
    const errors = body?.errors?.map((error) => error.message).join('; ');
    throw new Error(`Cloudflare API request failed: ${response.status} ${errors || response.statusText}`);
  }

  return body;
}

async function getZoneId() {
  const body = await cfFetch(`/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active&per_page=50`);
  const zone = body.result?.find((item) => normalizeName(item.name) === ZONE_NAME);

  if (!zone) {
    throw new Error(`Cloudflare zone not found: ${ZONE_NAME}`);
  }

  return zone.id;
}

async function listDnsRecords(zoneId) {
  const records = [];
  let page = 1;
  let totalPages = 1;

  do {
    const body = await cfFetch(`/zones/${zoneId}/dns_records?per_page=100&page=${page}`);
    records.push(...(body.result ?? []));
    totalPages = body.result_info?.total_pages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return records;
}

function makeNoop(type, name, content, reason) {
  return {
    action: 'noop',
    type,
    name,
    content,
    reason
  };
}

function makeCreate(zoneId, type, name, content, extra = {}) {
  return {
    action: 'create',
    type,
    name,
    content,
    method: 'POST',
    path: `/zones/${zoneId}/dns_records`,
    body: {
      type,
      name,
      content,
      ttl: AUTO_TTL,
      ...extra
    }
  };
}

function makeUpdate(zoneId, record, content, extra = {}) {
  return {
    action: 'update',
    type: record.type,
    name: record.name,
    existingContent: record.content,
    content,
    method: 'PUT',
    path: `/zones/${zoneId}/dns_records/${record.id}`,
    body: {
      type: record.type,
      name: record.name,
      content,
      ttl: AUTO_TTL,
      ...extra
    }
  };
}

function planSpf(zoneId, records) {
  const spfRecords = records.filter((record) => {
    return (
      record.type === 'TXT' &&
      normalizeName(record.name) === ZONE_NAME &&
      normalizeTxtContent(record.content).toLowerCase().startsWith('v=spf1')
    );
  });

  if (spfRecords.length > 1) {
    const found = spfRecords.map((record) => `- ${record.id}: ${record.content}`).join('\n');
    throw new Error(
      [
        `Found more than one SPF TXT record at ${ZONE_NAME}.`,
        'Cloudflare DNS must be checked manually before this script can continue.',
        found
      ].join('\n')
    );
  }

  if (spfRecords.length === 0) {
    return makeCreate(zoneId, 'TXT', ZONE_NAME, TARGET_SPF);
  }

  const [record] = spfRecords;
  const current = normalizeTxtContent(record.content);

  if (current === TARGET_SPF && record.ttl === AUTO_TTL) {
    return makeNoop('TXT', ZONE_NAME, TARGET_SPF, 'SPF record already matches target value');
  }

  return makeUpdate(zoneId, record, TARGET_SPF);
}

function planCname(zoneId, records, target) {
  const sameNameRecords = records.filter((record) => normalizeName(record.name) === normalizeName(target.name));
  const conflictingRecords = sameNameRecords.filter((record) => record.type !== 'CNAME');

  if (conflictingRecords.length > 0) {
    const found = conflictingRecords.map((record) => `- ${record.type} ${record.name}: ${record.content}`).join('\n');
    throw new Error(
      [
        `Found non-CNAME record(s) at ${target.name}.`,
        'Cloudflare DNS must be checked manually before this script can continue.',
        found
      ].join('\n')
    );
  }

  const cnameRecords = sameNameRecords.filter((record) => record.type === 'CNAME');

  if (cnameRecords.length > 1) {
    const found = cnameRecords.map((record) => `- ${record.id}: ${record.content}`).join('\n');
    throw new Error(
      [
        `Found more than one CNAME record at ${target.name}.`,
        'Cloudflare DNS must be checked manually before this script can continue.',
        found
      ].join('\n')
    );
  }

  if (cnameRecords.length === 0) {
    return makeCreate(zoneId, 'CNAME', target.name, target.content, { proxied: false });
  }

  const [record] = cnameRecords;
  const contentMatches = normalizeDnsContent(record.content) === normalizeDnsContent(target.content);
  const dnsOnlyMatches = record.proxied === false;
  const ttlMatches = record.ttl === AUTO_TTL;

  if (contentMatches && dnsOnlyMatches && ttlMatches) {
    return makeNoop('CNAME', target.name, target.content, 'CNAME already matches target value');
  }

  return makeUpdate(zoneId, record, target.content, { proxied: false });
}

function printPlan(operations) {
  const changes = operations.filter((operation) => operation.action !== 'noop');
  const noops = operations.filter((operation) => operation.action === 'noop');

  console.log(APPLY ? 'Mode: APPLY_DNS=1, changes will be written.' : 'Mode: dry-run, no DNS changes will be written.');
  console.log(`Zone: ${ZONE_NAME}`);
  console.log('');

  if (changes.length === 0) {
    console.log('Planned changes: none');
  } else {
    console.log('Planned changes:');
    for (const operation of changes) {
      console.log(`- ${operation.action.toUpperCase()} ${operation.type} ${operation.name}`);
      if (operation.existingContent) {
        console.log(`  from: ${operation.existingContent}`);
      }
      console.log(`  to:   ${operation.content}`);
      if (operation.type === 'CNAME') {
        console.log('  proxied: false');
      }
      console.log('  ttl: auto');
    }
  }

  if (noops.length > 0) {
    console.log('');
    console.log('Already correct:');
    for (const operation of noops) {
      console.log(`- ${operation.type} ${operation.name}: ${operation.reason}`);
    }
  }

  if (!APPLY) {
    console.log('');
    console.log('Dry-run only. To apply, run: APPLY_DNS=1 node scripts/cloudflare/setup-enginemailer-dns.mjs');
  }
}

async function applyOperations(operations) {
  const changes = operations.filter((operation) => operation.action !== 'noop');

  for (const operation of changes) {
    await cfFetch(operation.path, {
      method: operation.method,
      body: JSON.stringify(operation.body)
    });
    console.log(`Applied ${operation.action}: ${operation.type} ${operation.name}`);
  }

  console.log(`Applied ${changes.length} DNS change(s).`);
}

async function main() {
  requireToken();

  const zoneId = await getZoneId();
  const records = await listDnsRecords(zoneId);

  const operations = [
    planSpf(zoneId, records),
    ...CNAME_TARGETS.map((target) => planCname(zoneId, records, target))
  ];

  printPlan(operations);

  if (APPLY) {
    console.log('');
    await applyOperations(operations);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
