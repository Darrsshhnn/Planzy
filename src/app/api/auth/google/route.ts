/**
 * POST /api/auth/google { idToken }: checks a Firebase ID token from
 * "Continue with Google" and returns the person's name, email and photo.
 *
 * The token is checked by Google (Firebase's accounts:lookup), so a made-up
 * token is refused. We then require that the account signed in with Google
 * and that Google has verified its email address.
 */
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAgk9t2KG0ks7Gca8JCgDgDkmO0aS7V0hw";

interface LookupUser {
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  photoUrl?: string;
  disabled?: boolean;
  providerUserInfo?: { providerId: string; email?: string; displayName?: string; photoUrl?: string }[];
}

export async function POST(request: Request) {
  let idToken = "";
  try {
    const body = (await request.json()) as { idToken?: unknown };
    idToken = typeof body.idToken === "string" ? body.idToken : "";
  } catch {
    // fall through
  }
  if (!idToken || idToken.length > 8192) return Response.json({ error: "Missing Google sign-in" }, { status: 400 });

  let user: LookupUser | undefined;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    });
    if (!res.ok) return Response.json({ error: "Google couldn't verify this sign-in. Try again." }, { status: 401 });
    user = ((await res.json()) as { users?: LookupUser[] }).users?.[0];
  } catch {
    return Response.json({ error: "Couldn't reach Google. Try again." }, { status: 502 });
  }

  const google = user?.providerUserInfo?.find((p) => p.providerId === "google.com");
  if (!user || !google || user.disabled) {
    return Response.json({ error: "Sign in with a Google account to continue" }, { status: 401 });
  }
  const email = user.email || google.email;
  if (!email || !user.emailVerified) {
    return Response.json({ error: "Use a Google account with a verified email address" }, { status: 403 });
  }

  return Response.json({
    name: user.displayName || google.displayName || email.split("@")[0],
    email,
    picture: user.photoUrl || google.photoUrl || "",
  });
}
