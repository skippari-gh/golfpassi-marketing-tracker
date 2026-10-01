import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function meta(path: string, token: string, fields: string) {
  const url = new URL(`https://graph.facebook.com/v24.0/${path}`)
  url.searchParams.set('fields', fields)
  url.searchParams.set('access_token', token)

  const response = await fetch(url, { cache: 'no-store' })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Meta API error')
  }

  return data
}

export async function GET() {
  try {
    const token = process.env.META_ACCESS_TOKEN

    if (!token) {
      throw new Error('META_ACCESS_TOKEN missing')
    }

    const pages = await meta(
      'me/accounts',
      token,
      'id,name,instagram_business_account{id,username}'
    )

    const connections = pages.data || []

    const golfpassi =
      connections.find((page: any) =>
        String(page.name).toLowerCase().includes('golfpassi')
      ) || connections[0]

    if (!golfpassi) {
      return NextResponse.json({
        ok: true,
        pages: [],
        page: null,
        instagram: null,
      })
    }

    const page = await meta(
      String(golfpassi.id),
      token,
      'id,name,followers_count,fan_count'
    )

    const instagram = golfpassi.instagram_business_account?.id
      ? await meta(
          String(golfpassi.instagram_business_account.id),
          token,
          'id,username,followers_count,media_count'
        )
      : null

    return NextResponse.json({
      ok: true,
      pages: connections,
      page,
      instagram,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown Meta API error',
      },
      { status: 500 }
    )
  }
}
