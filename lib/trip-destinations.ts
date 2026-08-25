import { normalizeTripIdentityText } from './trip-identity'

export type DestinationTrip = {
  id: string
  destination_id?: string | null
  name: string
  country: string
  start_date: string
  end_date: string
}

export type TripDestinationGroup<
  T extends DestinationTrip,
> = {
  key: string
  name: string
  country: string
  trips: T[]
}

function removeDuration(
  value: string
) {
  return value
    .replace(
      /\b\d+\s*(?:(?:tai|–|—|-)\s*\d+\s*)?vrk\b/giu,
      ''
    )
    .replace(/\s+[–—-]\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitName(value: string) {
  return value
    .split(/\s+[–—-]\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function getTripDestination(
  trip: Pick<
    DestinationTrip,
    'name' | 'country'
  >
) {
  const nameWithoutDuration =
    removeDuration(trip.name)

  const nameParts =
    splitName(
      nameWithoutDuration
    )

  const firstPart =
    nameParts[0] ||
    nameWithoutDuration ||
    trip.name

  const destinationName =
    normalizeTripIdentityText(
      firstPart
    ) === 'long stay' &&
    nameParts[1]
      ? nameParts[1]
      : firstPart

  return {
    key: [
      normalizeTripIdentityText(
        trip.country
      ),
      normalizeTripIdentityText(
        destinationName
      ),
    ].join('|'),
    name: destinationName,
  }
}

export function groupTripsByDestination<
  T extends DestinationTrip,
>(trips: T[]) {
  const groups = new Map<
    string,
    TripDestinationGroup<T>
  >()

  for (const trip of trips) {
    const destination =
      getTripDestination(trip)

    const destinationKey =
      trip.destination_id ||
      destination.key

    const existingGroup =
      groups.get(destinationKey)

    if (existingGroup) {
      existingGroup.trips.push(
        trip
      )
      continue
    }

    groups.set(destinationKey, {
      key: destinationKey,
      name: destination.name,
      country: trip.country,
      trips: [trip],
    })
  }

  return Array.from(
    groups.values()
  ).map((group) => ({
    ...group,
    trips: group.trips.sort(
      (a, b) => {
        const startComparison =
          a.start_date.localeCompare(
            b.start_date
          )

        if (startComparison !== 0) {
          return startComparison
        }

        return a.end_date.localeCompare(
          b.end_date
        )
      }
    ),
  }))
}
