import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabase } from '../../../../../lib/supabase'
import { getMarketingPlanItems } from '../../../../../lib/marketing-plan'
import {
  getChannels,
  getTripWithPriority,
} from '../../../../../lib/trips'
import MarketingPlanItems from '../../../../components/MarketingPlanItems'

export const dynamic = 'force-dynamic'

export default async function NewMarketingPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [trip, channels] = await Promise.all([
    getTripWithPriority(id),
    getChannels(),
  ])

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

    const createdBy = String(
      formData.get('created_by') || ''
    ).trim()

    const planItems = getMarketingPlanItems(formData)

    const { error } = await supabase
      .from('marketing_plan')
      .insert(
        planItems.map((item) => ({
          trip_id: id,
          ...item,
          status: 'planned',
          created_by: createdBy || null,
        }))
      )

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/')
    revalidatePath(`/trips/${id}`)

    const selectedMonth = planItems
      .map((item) => item.planned_date)
      .sort()[0]
      .slice(0, 7)

    redirect(`/?month=${selectedMonth}&view=planned`)
  }

  return (
    <main className="container">
      <nav className="nav">
        <Link href="/">Nosta seuraavaksi</Link>
        <Link href="/trips">Matkat</Link>
        <Link href={`/trips/${id}`}>Takaisin matkaan</Link>
      </nav>

      <article className="card">
        <h1>Lisää markkinointisuunnitelma</h1>

        <p className="meta">
          {trip.name} · {trip.country}
        </p>

        <p className="meta">
          Lisää kaikki matkalle suunnitellut kanavat samalla kertaa.
          Ne näkyvät kalenterissa yhdellä matkakortilla.
        </p>

        <form action={createPlan}>
          <MarketingPlanItems
            channelNames={channels.map((channel) => channel.name)}
            defaultDate={new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Europe/Helsinki',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(new Date())}
          />

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
