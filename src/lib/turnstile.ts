// Cloudflare Turnstile server-side verification

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function isTurnstileEnabled(): boolean {
  return !!(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET);
}

export function getSiteKey(): string {
  return process.env.TURNSTILE_SITE_KEY || '';
}

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!isTurnstileEnabled()) return true;

  const secret = process.env.TURNSTILE_SECRET!;

  const body: Record<string, string> = { secret, response: token };
  if (ip) body.remoteip = ip;

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });

  const data = (await res.json()) as { success: boolean };
  return data.success;
}
