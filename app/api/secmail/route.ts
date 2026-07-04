import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const login = searchParams.get('login')
    const domain = searchParams.get('domain')
    const id = searchParams.get('id')

    if (!action || !login || !domain) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    let targetUrl = `https://www.1secmail.com/api/v1/?action=${action}&login=${login}&domain=${domain}`
    if (id) {
      targetUrl += `&id=${id}`
    }

    const response = await fetch(targetUrl, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Upstream API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Secmail Proxy Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from upstream API' },
      { status: 502 }
    )
  }
}
