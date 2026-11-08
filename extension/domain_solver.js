/**
 * ⚡ LINK4M DOMAIN SOLVER & UNMASKER ⚡
 * Client-side domain unmasking and keyword extractor
 */

const VALID_TLDS = [
  'com.vn', 'com.tw', 'co.uk', 'co.jp', 'za.com', 'de.com', 'uk.com', 'jpn.com', 'gb.net', 'jp.net', 'cn.com',
  'in.net', 'com.co', 'co.in', 'net.in', 'stridewalk.in', 'org.vn', 'edu.vn', 'pro', 'fun', 'bet', 'asia',
  'com', 'net', 'org', 'io', 'cc', 'me', 'vn', 'tw', 'vip', 'tv', 'co', 'site', 'top', 'online', 'xyz',
  'info', 'biz', 'club', 'games', 'app', 'live', 'ai', 'in', 'us', 'uk'
];

function sanitizeDomain(str) {
  if (!str) return '';
  let s = str.trim().toLowerCase();
  s = s.replace(/^(?:b[uư][oơ]c|buroc)\s*\d*\s*/i, '');
  s = s.replace(/^(?:bam|click|vao|tim|website|websiter|trangweb|web|site|truy cap)+/i, '');
  s = s.replace(/[^\w\.\-\*]/g, '');
  return s.replace(/^[\.\-\*]+|[\.\-\*]+$/g, '');
}

function unmaskDomainCandidates(rawText) {
  if (!rawText) return [];
  const results = [];
  const clean = rawText.replace(/★/g, '*').replace(/x/g, 'x');

  // Pattern 1: domain.c***.tw / domain.co***.vn / domain.co***.tw
  const p1 = /([a-zA-Z0-9\-]{2,})\.(?:co|c)\*+\.([a-zA-Z]{2,4})/gi;
  let m;
  while ((m = p1.exec(clean)) !== null) {
    const p = m[1].toLowerCase(), cc = m[2].toLowerCase();
    results.push(`${p}.com.${cc}`, `${p}.co.${cc}`, `${p}.${cc}`);
  }

  // Pattern 2: domain.c*** or domain.co***
  const p2 = /([a-zA-Z0-9\-]{2,})\.(?:co|c)\*+(?![a-zA-Z0-9])/gi;
  while ((m = p2.exec(clean)) !== null) {
    results.push(`${m[1].toLowerCase()}.com`);
  }

  // Pattern 3: domain.n***
  const p3 = /([a-zA-Z0-9\-]{2,})\.n\*+(?![a-zA-Z0-9])/gi;
  while ((m = p3.exec(clean)) !== null) {
    results.push(`${m[1].toLowerCase()}.net`);
  }

  // Pattern 4: domain.o***
  const p4 = /([a-zA-Z0-9\-]{2,})\.o\*+(?![a-zA-Z0-9])/gi;
  while ((m = p4.exec(clean)) !== null) {
    results.push(`${m[1].toLowerCase()}.org`);
  }

  // Pattern 5: domain.v***
  const p5 = /([a-zA-Z0-9\-]{2,})\.v\*+(?![a-zA-Z0-9])/gi;
  while ((m = p5.exec(clean)) !== null) {
    results.push(`${m[1].toLowerCase()}.vn`);
  }

  // Pattern 6: split/masked domains like name.***.com
  const p6 = /([a-zA-Z0-9\-]{3,})\.(?:[\s\*\.\-\_]+)(com|net|org|vn|tw|za\.com|co|site|vip)/gi;
  while ((m = p6.exec(clean)) !== null) {
    const p = m[1].toLowerCase(), suf = m[2].toLowerCase();
    results.push(`${p}.za.${suf}`, `${p}.${suf}`, `${p}.com.${suf}`, `${p}.com`, `${p}.net`, `${p}.org`);
  }

  // Pattern 7: masked prefix e.g. secgr***.vn -> secgroup.vn
  const p7 = /([a-zA-Z0-9\-]{2,})\*+\.([a-zA-Z0-9\.\-]+)/gi;
  while ((m = p7.exec(clean)) !== null) {
    const prefix = m[1].toLowerCase(), ext = m[2].toLowerCase();
    results.push(`${prefix}.${ext}`);
  }

  // Pattern 8: Plain domains in text
  const p8 = /(?:https?:\/\/)?([a-zA-Z0-9\-]{2,}\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi;
  while ((m = p8.exec(clean)) !== null) {
    const d = m[1].toLowerCase();
    if (!d.includes('link4m') && !d.includes('google') && !d.includes('youtube')) {
      results.push(d);
    }
  }

  const out = [];
  for (const r of results) {
    const s = sanitizeDomain(r);
    if (s && s.includes('.') && s.split('.')[0].length >= 2) {
      if (!out.includes(s)) out.push(s);
    }
  }
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { unmaskDomainCandidates, sanitizeDomain };
}
