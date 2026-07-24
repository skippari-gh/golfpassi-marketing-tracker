export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(
  request: Request
) {
  const cronSecret =
    process.env.CRON_SECRET

  const syncSecret =
    process.env.SYNC_SECRET

  if (!cronSecret || !syncSecret) {
    return Response.json(
      {
        success: false,
        error:
          'CRON_SECRET tai SYNC_SECRET puuttuu Vercelin ympäristömuuttujista.',
      },
      {
        status: 500,
      }
    )
  }

  const authorization =
    request.headers.get(
      'authorization'
    )

  if (
    authorization !==
    `Bearer ${cronSecret}`
  ) {
    return Response.json(
      {
        success: false,
        error:
          'Cron-pyynnön tunnistautuminen epäonnistui.',
      },
      {
        status: 401,
      }
    )
  }

  const syncUrl = new URL(
    '/api/sync-trips',
    request.url
  )

  syncUrl.searchParams.set(
    'save',
    '1'
  )

  const response = await fetch(
    syncUrl,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        authorization:
          `Bearer ${syncSecret}`,
      },
    }
  )

  const responseText =
    await response.text()

  return new Response(
    responseText,
    {
      status: response.status,
      headers: {
        'content-type':
          response.headers.get(
            'content-type'
          ) ||
          'application/json; charset=utf-8',

        'cache-control':
          'no-store, max-age=0',
      },
    }
  )
}