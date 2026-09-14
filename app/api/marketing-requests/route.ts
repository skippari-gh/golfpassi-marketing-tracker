import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabase } from '../../../lib/supabase'

const MARKETING_NOTIFICATION_EMAIL = 'jani.kinnunen@golfpassi.fi'

function getToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function sendMarketingRequestNotification({
  destinationName,
  destinationCountry,
  requesterName,
  requestText,
  priority,
}: {
  destinationName: string
  destinationCountry: string
  requesterName: string
  requestText: string
  priority: 'high' | 'normal'
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.MARKETING_NOTIFICATION_FROM

  if (!apiKey || !from) {
    console.error(
      'Markkinointipyynnön sähköposti-ilmoitusta ei lähetetty: RESEND_API_KEY tai MARKETING_NOTIFICATION_FROM puuttuu.'
    )
    return
  }

  const isUrgent = priority === 'high'
  const subject = `${isUrgent ? 'KIIREELLINEN: ' : ''}Uusi markkinointipyyntö – ${destinationName}`
  const text = [
    'Golfpassin Marketing Trackeriin on tullut uusi markkinointipyyntö.',
    '',
    `Kohde: ${destinationName} · ${destinationCountry}`,
    `Pyytäjä: ${requesterName}`,
    `Kiireellisyys: ${isUrgent ? 'Kiireellinen' : 'Normaali'}`,
    '',
    'Pyyntö:',
    requestText,
    '',
    'Pyyntö näkyy myös Marketing Trackerin etusivulla.',
  ].join('\n')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [MARKETING_NOTIFICATION_EMAIL],
        subject,
        text,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(
        'Markkinointipyynnön sähköposti-ilmoituksen lähetys epäonnistui:',
        response.status,
        await response.text()
      )
    }
  } catch (error) {
    console.error(
      'Markkinointipyynnön sähköposti-ilmoituksen lähetys epäonnistui:',
      error
    )
  }
}

export async function POST(request: Request) {
  const formData = await request.formData()

  const destinationId = String(formData.get('destination_id') || '')
  const requesterName = String(formData.get('requester_name') || '').trim()
  const requestText = String(formData.get('request_text') || '').trim()
  const priority: 'high' | 'normal' =
    formData.get('urgent') === 'on' ? 'high' : 'normal'

  if (!destinationId || !requesterName || !requestText) {
    return new NextResponse(
      'Valitse kohde ja täytä nimi sekä markkinointipyyntö.',
      { status: 400 }
    )
  }

  const { data: destination, error: destinationError } = await supabase
    .from('destinations')
    .select('name, country')
    .eq('id', destinationId)
    .single()

  if (destinationError || !destination) {
    return new NextResponse('Valittua kohdetta ei löytynyt.', { status: 400 })
  }

  const { data: representativeTrip, error: tripError } = await supabase
    .from('trips')
    .select('id')
    .eq('destination_id', destinationId)
    .eq('status', 'active')
    .gte('end_date', getToday())
    .order('start_date', { ascending: true })
    .limit(1)
    .single()

  if (tripError || !representativeTrip) {
    return new NextResponse('Kohteelle ei löytynyt tulevaa lähtöä.', {
      status: 400,
    })
  }

  const { error } = await supabase
    .from('marketing_requests')
    .insert({
      destination_id: destinationId,
      trip_id: representativeTrip.id,
      requester_name: requesterName,
      request_text: requestText,
      priority,
      desired_date: null,
      status: 'open',
    })

  if (error) {
    console.error('Markkinointipyynnön tallennus epäonnistui:', error)
    return new NextResponse('Markkinointipyynnön tallennus epäonnistui.', {
      status: 500,
    })
  }

  await sendMarketingRequestNotification({
    destinationName: destination.name,
    destinationCountry: destination.country,
    requesterName,
    requestText,
    priority,
  })

  revalidatePath('/')
  return NextResponse.redirect(new URL('/', request.url), 303)
}
