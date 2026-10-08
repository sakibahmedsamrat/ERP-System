import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secretKey = 'your-secret-key-change-it-in-production';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // Changed from 1 day to 1 hour
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function login(user: { id: string; userId: string; name: string; role: string; modules: string }) {
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const session = await encrypt({ user, expires });

  cookies().set('session', session, { expires, httpOnly: true });
}

export async function logout() {
  cookies().set('session', '', { expires: new Date(0) });
}

export async function getSession() {
  const session = cookies().get('session')?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (err) {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  if (!session) return;

  try {
    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const res = NextResponse.next();
    res.cookies.set({
      name: 'session',
      value: await encrypt(parsed),
      httpOnly: true,
      expires: parsed.expires,
    });
    return res;
  } catch (error) {
    return;
  }
}
