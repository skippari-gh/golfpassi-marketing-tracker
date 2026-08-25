import { redirect } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: trip } = await supabase
    .from('trips')
    .select('destination_id')
    .eq('id', id)
    .maybeSingle()

  if (!trip?.destination_id) {
    redirect('/trips')
  }

  redirect(`/destinations/${trip.destination_id}`)
}
