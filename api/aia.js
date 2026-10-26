// Some servers (SAWS is one) send their certificate without the "intermediate"
// certificate that links it to a trusted root. Browsers fix this by downloading
// the missing one from the address written inside the certificate (called AIA);
// Node doesn't, so it fails with UNABLE_TO_VERIFY_LEAF_SIGNATURE.
// getWithAia does what the browser does, then connects again with full checking,
// so the site still has to chain up to a real trusted root.
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import { X509Certificate } from 'node:crypto';

// Errors that mean "chain incomplete", not "certificate bad".
export const MISSING_CHAIN = new Set(['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'UNABLE_TO_GET_ISSUER_CERT']);

const TIMEOUT_MS = 8000;
const found = new Map(); // host -> intermediate certificates (PEM), so the lookup runs once

// Plain GET -> { status, headers, body (Buffer) }
function get(url, options = {}) {
  const lib = url.startsWith('https:') ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.get(url, { ...options, timeout: TIMEOUT_MS }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timed out')));
    req.on('error', reject);
  });
}

// Read the site's certificate only (nothing is sent, so not checking it here is safe).
function siteCertificate(host, port) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerX509Certificate();
      socket.end();
      if (cert) resolve(cert);
      else reject(new Error('no certificate'));
    });
    socket.setTimeout(TIMEOUT_MS, () => socket.destroy(new Error('timed out')));
    socket.on('error', reject);
  });
}

const issuerUrl = (cert) => cert.infoAccess?.match(/CA Issuers - URI:(\S+)/)?.[1];

// New roots that Node doesn't ship yet, and where to get a copy signed by an older
// root Node does trust ("cross-signed"). SAWS's GoDaddy certificate needs the first one.
// https://certs.godaddy.com/repository
const CROSS_SIGNED = {
  'GoDaddy TLS Root CA - R1': 'https://certs.godaddy.com/repository/gd_tls_root-r1-cross-g2.crt.pem',
  'Starfield TLS Root CA - R1': 'https://certs.godaddy.com/repository/sf_tls_root-r1-cross-g2.crt.pem',
};

const commonName = (dn) => dn.match(/CN=([^\n]+)/)?.[1] ?? dn;

// Node's own root list plus the computer's (Windows/Linux) trusted roots, which can hold
// roots Node doesn't ship. getCACertificates needs Node 22.15+, so it's optional.
const trustedRoots = () => [...new Set([...tls.rootCertificates, ...(tls.getCACertificates?.('system') ?? [])])];

// "CN=a <- CN=b" for error messages, so a failure says which link is missing.
const describe = (certs) => certs.map((c) => `${commonName(c.subject)} (from ${commonName(c.issuer)})`).join(' <- ');

// Walk up the chain (at most 3 steps). Self-signed roots are never added:
// trust must still come from the trusted root lists.
async function intermediates(host, port, crossSigned) {
  const pems = [];
  let cert = await siteCertificate(host, port);
  const chain = [cert];
  for (let step = 0; step < 3; step++) {
    const url = issuerUrl(cert);
    if (!url || !/^https?:\/\//.test(url)) break;
    const res = await get(url);
    if (res.status !== 200) break;
    const issuer = new X509Certificate(res.body); // DER or PEM both work
    if (issuer.checkIssued(issuer)) break; // a root: stop
    pems.push(issuer.toString());
    chain.push(issuer);
    cert = issuer;
  }
  // The chain ends at a root Node may not know: add its cross-signed copy if there is one.
  const cross = crossSigned[commonName(cert.issuer)];
  if (cross && !cert.checkIssued(cert)) {
    const res = await get(cross);
    if (res.status === 200) {
      const copy = new X509Certificate(res.body);
      pems.push(copy.toString());
      chain.push(copy);
    }
  }
  if (!pems.length) throw new Error(`could not find the missing certificate for ${describe(chain)}`);
  return { pems, chain: describe(chain) };
}

// GET a URL as text, adding any missing intermediate certificates. Follows up to 3 redirects.
export async function getWithAia(url, { roots = trustedRoots(), crossSigned = CROSS_SIGNED } = {}) {
  for (let hop = 0; hop < 4; hop++) {
    const { protocol, hostname, port } = new URL(url);
    let options = {};
    if (protocol === 'https:') {
      const key = `${hostname}:${port || 443}`;
      if (!found.has(key)) found.set(key, intermediates(hostname, Number(port) || 443, crossSigned).catch((err) => { found.delete(key); throw err; }));
      const { pems, chain } = await found.get(key);
      options = { ca: [...roots, ...pems], chain };
    }
    const { chain, ...tlsOptions } = options;
    const res = await get(url, tlsOptions).catch((err) => {
      throw new Error(chain ? `${err.message} [chain: ${chain}]` : err.message);
    });
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      url = new URL(res.headers.location, url).href;
      continue;
    }
    if (res.status !== 200) throw new Error(`answered ${res.status}`);
    return res.body.toString('utf8');
  }
  throw new Error('too many redirects');
}
