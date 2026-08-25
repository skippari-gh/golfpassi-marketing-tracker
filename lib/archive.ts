import { supabase } from './supabase'

export type ArchiveEntityType =
  | 'plan'
  | 'action'
  | 'request'

const tableByEntityType = {
  plan: 'marketing_plan',
  action: 'marketing_actions',
  request: 'marketing_requests',
} as const

export function parseArchiveEntity(
  value: string
) {
  const separatorIndex = value.indexOf('-')

  if (separatorIndex < 1) {
    throw new Error('Arkistoitavan kohteen tunniste puuttuu.')
  }

  const entityType = value.slice(
    0,
    separatorIndex
  ) as ArchiveEntityType

  const id = value.slice(separatorIndex + 1)

  if (!(entityType in tableByEntityType) || !id) {
    throw new Error('Tuntematon arkistoitava kohde.')
  }

  return {
    entityType,
    id,
    table: tableByEntityType[entityType],
  }
}

export async function archiveEntity(
  value: string
) {
  const entity = parseArchiveEntity(value)

  const { data, error } = await supabase
    .from(entity.table)
    .update({ archived_at: new Date().toISOString() })
    .eq('id', entity.id)
    .is('archived_at', null)
    .select('id, trip_id')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error(
      'Kohdetta ei löytynyt tai se on jo arkistoitu.'
    )
  }

  return {
    entityType: entity.entityType,
    tripId:
      'trip_id' in data &&
      typeof data.trip_id === 'string'
        ? data.trip_id
        : null,
  }
}

export async function restoreEntity(
  value: string
) {
  const entity = parseArchiveEntity(value)

  const { data, error } = await supabase
    .from(entity.table)
    .update({ archived_at: null })
    .eq('id', entity.id)
    .not('archived_at', 'is', null)
    .select('id, trip_id')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error(
      'Kohdetta ei löytynyt tai se on jo palautettu.'
    )
  }

  return {
    entityType: entity.entityType,
    tripId:
      'trip_id' in data &&
      typeof data.trip_id === 'string'
        ? data.trip_id
        : null,
  }
}
