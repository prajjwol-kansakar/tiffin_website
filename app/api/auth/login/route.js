import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const username =
    typeof credentials?.username === "string" ? credentials.username.trim() : "";
  const password =
    typeof credentials?.password === "string" ? credentials.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: "Username and password are required." },
      { status: 400 }
    );
  }

  const loginUrl = process.env.BACKEND_LOGIN_URL;
  if (!loginUrl) {
    return NextResponse.json(
      { ok: false, error: "The login service is not configured." },
      { status: 503 }
    );
  }

  let backendResponse;
  try {
    backendResponse = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("POST /api/auth/login could not reach the login service:", error);
    return NextResponse.json(
      { ok: false, error: "Could not reach the login service. Please try again." },
      { status: 502 }
    );
  }

  const responseText = await backendResponse.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: responseText || "Sign-in failed. Check your username and password.",
        },
        { status: backendResponse.status }
      );
    }
    return NextResponse.json(
      { ok: false, error: "The login service returned an invalid response." },
      { status: 502 }
    );
  }

  if (!backendResponse.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          result?.message ||
          result?.error ||
          "Sign-in failed. Check your username and password.",
      },
      { status: backendResponse.status }
    );
  }

  if (result?.success === false) {
    return NextResponse.json(
      {
        ok: false,
        error: result.message || "Sign-in failed. Check your username and password.",
      },
      { status: 401 }
    );
  }

  const session =
    result?.items && typeof result.items === "object" ? result.items : result;
  const expiresAt =
    typeof session?.accessExpiry === "string"
      ? Date.parse(session.accessExpiry)
      : NaN;
  if (
    typeof session?.accessToken !== "string" ||
    !session.accessToken ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now()
  ) {
    return NextResponse.json(
      { ok: false, error: "The login service returned an invalid or expired session." },
      { status: 502 }
    );
  }

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  };

  cookieStore.set("tiffin_access_token", session.accessToken, cookieOptions);
  cookieStore.set(
    "tiffin_username",
    session.username || username,
    cookieOptions
  );

  return NextResponse.json({ ok: true });
}
