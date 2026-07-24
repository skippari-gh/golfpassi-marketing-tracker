'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Comment = {
  id: string
  request_id: string
  commenter_name: string
  comment_text: string
  created_at: string
}

type CommentsRealtimeProps = {
  requestId: string
  initialComments: Comment[]
}

export default function CommentsRealtime({
  requestId,
  initialComments,
}: CommentsRealtimeProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commenterName, setCommenterName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const channel = supabase
      .channel(`request-comments-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketing_request_comments',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const newComment = payload.new as Comment

          setComments((currentComments) => {
            const alreadyExists = currentComments.some(
              (comment) => comment.id === newComment.id
            )

            if (alreadyExists) {
              return currentComments
            }

            return [...currentComments, newComment]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId])

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = commenterName.trim()
    const trimmedComment = commentText.trim()

    if (!trimmedName || !trimmedComment) {
      setErrorMessage('Täytä nimi ja kommentti.')
      return
    }

    setSaving(true)
    setErrorMessage('')

    const { error } = await supabase
      .from('marketing_request_comments')
      .insert({
        request_id: requestId,
        commenter_name: trimmedName,
        comment_text: trimmedComment,
      })

    if (error) {
      setErrorMessage(error.message)
      setSaving(false)
      return
    }

    setCommentText('')
    setSaving(false)
  }

  return (
    <>
      <h2>Kommentit</h2>

      {comments.length > 0 ? (
        comments.map((comment) => (
          <article className="card" key={comment.id}>
            <strong>{comment.commenter_name}</strong>

            <p>{comment.comment_text}</p>

            <p className="meta">
              {new Date(comment.created_at).toLocaleString('fi-FI')}
            </p>
          </article>
        ))
      ) : (
        <article className="card">
          <p>Ei vielä kommentteja.</p>
        </article>
      )}

      <h2>Lisää kommentti</h2>

      <article className="card">
        <form onSubmit={addComment}>
          <label>
            Nimi
            <input
              type="text"
              value={commenterName}
              onChange={(event) => setCommenterName(event.target.value)}
              required
            />
          </label>

          <label>
            Kommentti
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              rows={5}
              required
            />
          </label>

          {errorMessage && (
            <p className="reason">
              <strong>Virhe:</strong> {errorMessage}
            </p>
          )}

          <div className="actions">
            <button
              className="button"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Tallennetaan…' : 'Lisää kommentti'}
            </button>
          </div>
        </form>
      </article>
    </>
  )
}