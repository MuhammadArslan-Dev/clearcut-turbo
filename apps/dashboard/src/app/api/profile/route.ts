import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND!

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
      return NextResponse.json(
        { message: 'Invalid backend response' },
        { status: 502 }
      )
    }

    return NextResponse.json(data, { status: res.status })

  } catch (err) {
    console.error('[API/profile] Server error:', err)

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
