/**
 * POST /api/auth/google { credential }: checks a Google ID token from "Sign in
 * with Google" and returns the person's name, email and photo.
 *
 * Google itself vouches for the token: we ask Google's tokeninfo endpoint,
 * then require that it was issued by Google, for this app's client ID, is
 * not expired, and that the Google account's email is verified. Anything
 * else is refused.
 */
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

interface TokenInfo {
  aud?: string;
  iss?: string;
  exp?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  given_name?: string;
  picture?: string;
}

export async function POST(request: Request) {
  if (!CLIENT_ID) return Response.json({ error: "Google sign-in isn't set up on this server" }, { status: 503 });

  let credential = "";
  try {
    const body = (await request.json()) as { credential?: unknown };
    credential = typeof body.credential === "string" ? body.credential : "";
  } catch {
    // fall through
  }
  if (!credential || credential.length > 4096) return Response.json({ error: "Missing Google credential" }, { status: 400 });

  let info: TokenInfo;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
      cache: "no-store",
    });
    if (!res.ok) return Response.json({ error: "Google couldn't verify this sign-in" }, { status: 401 });
    info = (await res.json()) as TokenInfo;
  } catch {
    return Response.json({ error: "Couldn't reach Google. Try again." }, { status: 502 });
  }

  const verified = info.email_verified === true || info.email_verified === "true";
  const fresh = Number(info.exp ?? 0) * 1000 > Date.now();
  if (info.aud !== CLIENT_ID || !ISSUERS.has(info.iss ?? "") || !fresh) {
    return Response.json({ error: "This Google sign-in isn't valid for Planzy" }, { status: 401 });
  }
  if (!info.email || !verified) {
    return Response.json({ error: "Use a Google account with a verified email address" }, { status: 403 });
  }

  return Response.json({
    name: info.name || info.given_name || info.email.split("@")[0],
    email: info.email,
    picture: info.picture ?? "",
  });
}
