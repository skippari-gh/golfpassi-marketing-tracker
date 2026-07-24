'use client'

import { FormEvent, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Attachment = {
  id: string
  request_id: string
  uploader_name: string
  file_name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  created_at: string
}

type AttachmentsProps = {
  requestId: string
  initialAttachments: Attachment[]
}

const BUCKET_NAME = 'marketing-request-attachments'
const MAX_FILE_SIZE = 10 * 1024 * 1024

function formatFileSize(bytes: number | null) {
  if (!bytes) return ''

  if (bytes < 1024) {
    return `${bytes} tavua`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} kt`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mt`
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
}

export default function Attachments({
  requestId,
  initialAttachments,
}: AttachmentsProps) {
  const [attachments, setAttachments] =
    useState<Attachment[]>(initialAttachments)

  const [uploaderName, setUploaderName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function uploadAttachment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedUploaderName = uploaderName.trim()

    if (!trimmedUploaderName) {
      setErrorMessage('Kirjoita lataajan nimi.')
      return
    }

    if (!selectedFile) {
      setErrorMessage('Valitse liitetiedosto.')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage('Tiedoston enimmäiskoko on 10 Mt.')
      return
    }

    setUploading(true)
    setErrorMessage('')

    const safeFileName = sanitizeFileName(selectedFile.name)
    const filePath = `${requestId}/${crypto.randomUUID()}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, selectedFile, {
        contentType: selectedFile.type || undefined,
        upsert: false,
      })

    if (uploadError) {
      setErrorMessage(uploadError.message)
      setUploading(false)
      return
    }

    const { data: savedAttachment, error: databaseError } = await supabase
      .from('marketing_request_attachments')
      .insert({
        request_id: requestId,
        uploader_name: trimmedUploaderName,
        file_name: selectedFile.name,
        file_path: filePath,
        file_type: selectedFile.type || null,
        file_size: selectedFile.size,
      })
      .select()
      .single()

    if (databaseError) {
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])

      setErrorMessage(databaseError.message)
      setUploading(false)
      return
    }

    setAttachments((currentAttachments) => [
      savedAttachment as Attachment,
      ...currentAttachments,
    ])

    setSelectedFile(null)
    setUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section>
      <h2>Liitteet</h2>

      {attachments.length > 0 ? (
        <div className="grid">
          {attachments.map((attachment) => {
            const { data } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(attachment.file_path)

            return (
              <article className="card" key={attachment.id}>
                <h3>{attachment.file_name}</h3>

                <p className="meta">
                  Lisännyt: <strong>{attachment.uploader_name}</strong>
                </p>

                <p className="meta">
                  {formatFileSize(attachment.file_size)}
                  {attachment.file_type
                    ? ` · ${attachment.file_type}`
                    : ''}
                </p>

                <p className="meta">
                  {new Date(attachment.created_at).toLocaleString('fi-FI')}
                </p>

                <div className="actions">
                  <a
                    className="button secondary"
                    href={data.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Avaa liite
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <article className="card">
          <p>Ei vielä liitteitä.</p>
        </article>
      )}

      <h2>Lisää liite</h2>

      <article className="card">
        <form onSubmit={uploadAttachment}>
          <label>
            Nimi
            <input
              type="text"
              value={uploaderName}
              onChange={(event) => setUploaderName(event.target.value)}
              placeholder="Kuka lisää liitteen?"
              required
            />
          </label>

          <label>
            Tiedosto
            <input
              ref={fileInputRef}
              type="file"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] || null)
              }
              required
            />
          </label>

          <p className="meta">
            Tiedoston enimmäiskoko on 10 Mt.
          </p>

          {errorMessage && (
            <p className="reason">
              <strong>Virhe:</strong> {errorMessage}
            </p>
          )}

          <div className="actions">
            <button
              className="button"
              type="submit"
              disabled={uploading}
            >
              {uploading ? 'Ladataan…' : 'Lisää liite'}
            </button>
          </div>
        </form>
      </article>
    </section>
  )
}