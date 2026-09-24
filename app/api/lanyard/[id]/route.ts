import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^\d{5,25}$/.test(id)) {
    return NextResponse.json({ success: false, data: null }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${id}`, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })
    const body = await response.json()
    return NextResponse.json(body, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 502 })
  }
}
