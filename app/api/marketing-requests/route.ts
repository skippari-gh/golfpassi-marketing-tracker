import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabase } from '../../../lib/supabase'
import { getTripDestination } from '../../../lib/trip-destinations'

// Temporary delivery via the Resend account owner's Gmail until domain verification.
const MARKETING_NOTIFICATION_EMAIL = 'skippari@gmail.com'

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
  const from = 'Golfpassi Marketing Tracker <onboarding@resend.dev>'

  if (!apiKey) {
    console.error(
      'Markkinointipyynnön sähköposti-ilmoitusta ei lähetetty: RESEND_API_KEY puuttuu.'
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

  const tripId = String(formData.get('trip_id') || '')
  const requesterName = String(formData.get('requester_name') || '').trim()
  const requestText = String(formData.get('request_text') || '').trim()
  const priority: 'high' | 'normal' =
    formData.get('urgent') === 'on' ? 'high' : 'normal'

  if (!tripId || !requesterName || !requestText) {
    return new NextResponse(
      'Valitse kohde ja täytä nimi sekä markkinointipyyntö.',
      { status: 400 }
    )
  }

  const { data: representativeTrip, error: tripError } = await supabase
    .from('trips')
    .select('id, destination_id, name, country')
    .eq('id', tripId)
    .single()

  if (tripError || !representativeTrip) {
    console.error('Markkinointipyynnön matkaa ei löytynyt:', tripError)
    return new NextResponse('Valittua kohdetta ei löytynyt.', { status: 400 })
  }

  const { error } = await supabase
    .from('marketing_requests')
    .insert({
      destination_id: representativeTrip.destination_id || null,
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

  const destination = getTripDestination(representativeTrip)

  await sendMarketingRequestNotification({
    destinationName: destination.name,
    destinationCountry: representativeTrip.country,
    requesterName,
    requestText,
    priority,
  })

  revalidatePath('/')
  return NextResponse.redirect(new URL('/', request.url), 303)
}
