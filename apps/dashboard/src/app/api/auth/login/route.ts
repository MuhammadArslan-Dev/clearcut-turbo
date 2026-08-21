// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND!; // e.g. http://localhost:8000/api

export async function POST(req: Request) {
  const body = await req.json(); // { email, password }

  // Call Laravel login
  const laravelRes = await fetch(`${LARAVEL_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!laravelRes.ok) {
    const text = await laravelRes.text();
    return NextResponse.json(
      { message: text || 'Invalid credentials' },
      { status: 401 },
    );
  }

  // Expect: { token: string, user: {...} }
  const data = await laravelRes.json();
  const { token, user } = data;

  const res = NextResponse.json({ user });

  // SET SERVER COOKIE (HttpOnly)
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}