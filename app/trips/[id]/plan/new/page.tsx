import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import { getTripWithPriority } from '../../../../../lib/trips'

export const dynamic = 'force-dynamic'

export default async function NewMarketingPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const trip = await getTripWithPriority(id)

  if (!trip) {
    return (
      <main className="container">
        <p>Matkaa ei löytynyt.</p>

        <Link className="button" href="/trips">
          Takaisin matkoihin
        </Link>
      </main>
    )
  }

  async function createPlan(formData: FormData) {
    'use server'

    const plannedDate = String(
      formData.get('planned_date') || ''
    )

    const channel = String(
      formData.get('channel') || ''
    ).trim()

    const title = String(
      formData.get('title') || ''
    ).trim()

    const notes = String(
      formData.get('notes') || ''
    ).trim()

    const createdBy = String(
      formData.get('created_by') || ''
    ).trim()

    if (!plannedDate || !channel || !title) {
      throw new Error('Täytä päivämäärä, kanava ja otsikko.')
    }

    const { error } = await supabase
      .from('marketing_plan')
      .insert({
        trip_id: id,
        planned_date: plannedDate,
        channel,
        title,
        notes: notes || null,
        status: 'planned',
        created_by: createdBy || null,
      })

    if (error) {
      throw new Error(error.message)
    }

    redirect(`/trips/${id}`)
  }

  return (
    <main className="container">
      <nav className="nav">
        <Link href="/">Nosta seuraavaksi</Link>
        <Link href="/trips">Matkat</Link>
        <Link href={`/trips/${id}`}>Takaisin matkaan</Link>
      </nav>

      <article className="card">
        <h1>Lisää suunniteltu julkaisu</h1>

        <p className="meta">
          {trip.name} · {trip.country}
        </p>

        <form action={createPlan}>
          <p>
            <label>
              Päivämäärä
              <br />
              <input
                type="date"
                name="planned_date"
                required
              />
            </label>
          </p>

          <p>
            <label>
              Kanava
              <br />
              <select
                name="channel"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Valitse kanava
                </option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Uutiskirje">Uutiskirje</option>
                <option value="Verkkosivu">Verkkosivu</option>
                <option value="Blogi">Blogi</option>
                <option value="Banneri">Banneri</option>
              </select>
            </label>
          </p>

          <p>
            <label>
              Otsikko
              <br />
              <input
                type="text"
                name="title"
                placeholder="Esim. Kesän viimeiset paikat"
                required
              />
            </label>
          </p>

          <p>
            <label>
              Huomiot
              <br />
              <textarea
                name="notes"
                rows={5}
                placeholder="Lisätiedot..."
              />
            </label>
          </p>

          <p>
            <label>
              Suunnittelija
              <br />
              <input
                type="text"
                name="created_by"
                placeholder="Esim. Jani"
              />
            </label>
          </p>

          <div className="actions">
            <button className="button" type="submit">
              Tallenna suunnitelma
            </button>

            <Link
              className="button secondary"
              href={`/trips/${id}`}
            >
              Peruuta
            </Link>
          </div>
        </form>
      </article>
    </main>
  )
}