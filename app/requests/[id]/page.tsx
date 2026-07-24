import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import Attachments from './Attachments'
import CommentsRealtime from './CommentsRealtime'

export const dynamic = 'force-dynamic'

export default async function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: request, error: requestError } = await supabase
    .from('marketing_requests')
    .select('*, trips(name,country)')
    .eq('id', id)
    .single()

  if (requestError || !request) {
    return (
      <main className="container">
        <nav className="nav">
          <Link href="/">← Takaisin</Link>
        </nav>

        <h1>Toivetta ei löytynyt.</h1>
      </main>
    )
  }

  const { data: comments, error: commentsError } = await supabase
    .from('marketing_request_comments')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true })

  if (commentsError) {
    throw new Error(commentsError.message)
  }

  const { data: attachments, error: attachmentsError } =
    await supabase
      .from('marketing_request_attachments')
      .select('*')
      .eq('request_id', id)
      .order('created_at', { ascending: false })

  if (attachmentsError) {
    throw new Error(attachmentsError.message)
  }

  const priorityLabel = {
    low: 'Matala',
    normal: 'Normaali',
    high: 'Kiireellinen',
  } as const

  return (
    <main className="container">
      <nav className="nav">
        <Link href="/">← Takaisin</Link>
      </nav>

      <article className="card">
        <span className="score">
          {priorityLabel[
            request.priority as keyof typeof priorityLabel
          ] || request.priority}
        </span>

        <h1>
          {request.trips?.name || 'Yleinen markkinointitoive'}
        </h1>

        {request.trips?.country && (
          <p className="meta">{request.trips.country}</p>
        )}

        <p>{request.request_text}</p>

        <p className="meta">
          Toivonut: <strong>{request.requester_name}</strong>
        </p>

        {request.desired_date && (
          <p className="meta">
            Toivottu päivämäärä:{' '}
            <strong>{request.desired_date}</strong>
          </p>
        )}
      </article>

      <Attachments
        requestId={id}
        initialAttachments={attachments || []}
      />

      <CommentsRealtime
        requestId={id}
        initialComments={comments || []}
      />
    </main>
  )
}