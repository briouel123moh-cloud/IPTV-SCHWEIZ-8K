const ownerIssuer = "https://briouel123moh.cloudflareaccess.com";
// SHA-256 of the exact authorized email, to keep the mailbox out of public source.
const ownerEmailDigest = "de6d87856d0deb1d78fa5fe787a27e637dca0ed76bb304bb8d85f701413c0d4a";
const ownerKeyAlgorithm = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
let ownerKeys = [];
let ownerKeysExpire = 0;
let ownerKeyRetryAfter = 0;

function ownerDecode(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid JWT encoding");
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
}

async function ownerSigningKey(kid) {
  const now = Date.now();
  const cached = ownerKeys.find(key => key.kid === kid);
  if (cached && now < ownerKeysExpire) return cached;
  // Bound unknown-kid refreshes as well as retries during an outage.
  if (now < ownerKeyRetryAfter) return undefined;
  ownerKeyRetryAfter = now + 30_000;
  const response = await fetch(ownerIssuer + "/cdn-cgi/access/certs", {
    redirect: "error", signal: AbortSignal.timeout(5_000)
  });
  if (!response.ok) return undefined;
  const { keys } = await response.json();
  if (!Array.isArray(keys)) return undefined;
  ownerKeys = keys.filter(key => key.kty === "RSA" && (!key.alg || key.alg === "RS256")
    && (!key.use || key.use === "sig") && typeof key.kid === "string");
  ownerKeysExpire = now + 300_000;
  return ownerKeys.find(key => key.kid === kid);
}

/** Only a signed Cloudflare Access application assertion for this owner grants access. */
export async function isVerifiedOwner(request, audience) {
  try {
    if (typeof audience !== "string" || !/^[a-f0-9]{64}$/.test(audience)) return false;
    const token = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!token || token.length > 16_384) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const header = JSON.parse(decoder.decode(ownerDecode(parts[0])));
    if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid || header.crit) return false;
    const claims = JSON.parse(decoder.decode(ownerDecode(parts[1])));
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== ownerIssuer || claims.type !== "app" || !Array.isArray(claims.aud)
      || !claims.aud.includes(audience) || typeof claims.email !== "string"
      || typeof claims.sub !== "string" || !claims.sub || !Number.isSafeInteger(claims.iat)
      || claims.iat > now || !Number.isSafeInteger(claims.exp) || claims.exp <= now
      || (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > now))) return false;
    const jwk = await ownerSigningKey(header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, ownerKeyAlgorithm, false, ["verify"]);
    const encoder = new TextEncoder();
    const valid = await crypto.subtle.verify(ownerKeyAlgorithm, key, ownerDecode(parts[2]),
      encoder.encode(parts[0] + "." + parts[1]));
    if (!valid || claims.exp <= Math.floor(Date.now() / 1000)) return false;
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(claims.email));
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("") === ownerEmailDigest;
  } catch {
    return false;
  }
}
