/**
 * Server-side utility to verify a Google reCAPTCHA v3 token.
 * NEVER import this file from client components — it uses RECAPTCHA_SECRET_KEY.
 */

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MIN_SCORE_DEFAULT = 0.5;

interface RecaptchaVerifyResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  "error-codes"?: string[];
}

export class RecaptchaError extends Error {
  constructor(
    message: string,
    public readonly score?: number,
  ) {
    super(message);
    this.name = "RecaptchaError";
  }
}

/**
 * Verifies a reCAPTCHA v3 token against the Google API.
 * @param token  The token obtained client-side via grecaptcha.execute()
 * @param expectedAction  The action name used when generating the token (e.g. "login")
 * @param minScore  Minimum acceptable score (0.0–1.0). Defaults to 0.5.
 * @returns The verified score.
 * @throws RecaptchaError if verification fails or score is too low.
 */
export async function verifyRecaptchaToken(
  token: string,
  expectedAction?: string,
  minScore: number = MIN_SCORE_DEFAULT,
): Promise<number> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    throw new RecaptchaError("RECAPTCHA_SECRET_KEY is not configured.");
  }

  const params = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  const response = await fetch(RECAPTCHA_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new RecaptchaError(`reCAPTCHA verification HTTP error: ${response.status}`);
  }

  const data: RecaptchaVerifyResponse = await response.json();

  if (!data.success) {
    const codes = data["error-codes"]?.join(", ") ?? "unknown";
    throw new RecaptchaError(`reCAPTCHA verification failed: ${codes}`);
  }

  // Optionally verify the action matches to prevent token reuse across forms
  if (expectedAction && data.action !== expectedAction) {
    throw new RecaptchaError(
      `reCAPTCHA action mismatch: expected "${expectedAction}", got "${data.action}"`,
    );
  }

  if (data.score < minScore) {
    throw new RecaptchaError(
      `reCAPTCHA score too low: ${data.score} (minimum: ${minScore})`,
      data.score,
    );
  }

  return data.score;
}
