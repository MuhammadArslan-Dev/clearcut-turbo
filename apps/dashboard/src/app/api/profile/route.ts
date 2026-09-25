import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

// Same fallback as lib/api/client.ts — unset in production would otherwise
// silently fetch "undefined/..." (see this app's CLAUDE.md).
const API_BASE_URL =
  process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND ??
  'http://clearcutoff-main-backend.test/api'

export async function GET() {
  try {
    // ✅ cookies() is async in Next 15+
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      console.error('[API/profile] No auth token found')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const res = await fetch(`${API_BASE_URL}/v2/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      console.error('[API/profile] Invalid JSON from backend:', text)
      // Handled response, so onRequestError never sees it — report it here.
      Sentry.captureMessage('API /profile: invalid JSON from backend', {
        level: 'error',
        tags: { route: 'api/profile', upstream_status: String(res.status) },
        extra: { bodyPreview: text.slice(0, 200) },
      })
      return NextResponse.json(
        { message: 'Invalid backend response' },
        { status: 502 }
      )
    }

    return NextResponse.json(data, { status: res.status })

  } catch (err) {
    console.error('[API/profile] Server error:', err)
    // Caught and turned into a JSON 500, so onRequestError never sees it.
    Sentry.captureException(err, { tags: { route: 'api/profile' } })

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
