import { type NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

import { RecaptchaError, verifyRecaptchaToken } from "@/lib/recaptcha";

interface LoginRequestBody {
  email: string;
  password: string;
  recaptchaToken: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LoginRequestBody = await request.json();
    const { email, password, recaptchaToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña son requeridos." },
        { status: 400 },
      );
    }

    if (!recaptchaToken) {
      return NextResponse.json(
        { error: "Token de verificación requerido." },
        { status: 400 },
      );
    }

    // Verify reCAPTCHA server-side (Secret Key never leaves the server)
    try {
      const score = await verifyRecaptchaToken(recaptchaToken, "login", 0.5);
      console.log(`[reCAPTCHA] Login score: ${score} for ${email}`);
    } catch (err) {
      if (err instanceof RecaptchaError) {
        console.warn(`[reCAPTCHA] Login rejected: ${err.message}`);
        return NextResponse.json(
          { error: "Verificación de seguridad fallida. Por favor intenta de nuevo." },
          { status: 403 },
        );
      }
      throw err;
    }

    // Authenticate with PocketBase
    const pbUrl =
      process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "https://apiconvivencia.daemlu.cl";
    const pb = new PocketBase(pbUrl);

    await pb.collection("users").authWithPassword(email, password);

    // Return auth data to the client so it can set the cookie itself
    // (same pattern as the original login flow — client sets document.cookie)
    const cookieString = pb.authStore.exportToCookie({ httpOnly: false });

    return NextResponse.json(
      { success: true, cookie: cookieString },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("[Login API] Error:", error);

    // PocketBase 400 = bad credentials
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      (error as { status: number }).status === 400
    ) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Error interno. Por favor intenta de nuevo." },
      { status: 500 },
    );
  }
}
