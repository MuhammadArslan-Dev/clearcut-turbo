// // app/api/auth/logout/route.ts
// import { NextResponse } from 'next/server';
// import { cookies } from 'next/headers';

// const LARAVEL_API_URL = process.env.LARAVEL_API_URL!;

// export async function POST() {
//   const token = cookies().get('auth_token')?.value;

//   if (token) {
//     // Optional: tell Laravel to invalidate token
//     await fetch(`${LARAVEL_API_URL}/auth/logout`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//   }

//   const res = NextResponse.json({ ok: true });

//   // CLEAR COOKIE
//   res.cookies.set('auth_token', '', {
//     path: '/',
//     maxAge: 0,
//   });

//   return res;
// }