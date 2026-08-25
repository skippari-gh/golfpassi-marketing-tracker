function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeTripIdentityText(
  value: string
) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fi-FI')
    .replace(/&/g, ' ja ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getTripNameSimilarity(
  left: string,
  right: string
) {
  const normalizedLeft =
    normalizeTripIdentityText(left)

  const normalizedRight =
    normalizeTripIdentityText(right)

  if (
    !normalizedLeft ||
    !normalizedRight
  ) {
    return 0
  }

  if (
    normalizedLeft ===
    normalizedRight
  ) {
    return 100
  }

  const leftTokens = new Set(
    normalizedLeft.split(' ')
  )

  const rightTokens = new Set(
    normalizedRight.split(' ')
  )

  const sharedCount =
    Array.from(leftTokens).filter(
      (token) =>
        rightTokens.has(token)
    ).length

  if (sharedCount < 3) {
    return 0
  }

  const shorterCoverage =
    sharedCount /
    Math.min(
      leftTokens.size,
      rightTokens.size
    )

  const unionSize = new Set([
    ...leftTokens,
    ...rightTokens,
  ]).size

  const jaccard =
    sharedCount / unionSize

  if (
    shorterCoverage < 0.8 ||
    jaccard < 0.45
  ) {
    return 0
  }

  return Math.round(
    60 +
      shorterCoverage * 20 +
      jaccard * 20
  )
}

export function areTripsLikelyDuplicates(
  left: {
    name: string
    country: string
    start_date: string
    end_date: string
  },
  right: {
    name: string
    country: string
    start_date: string
    end_date: string
  }
) {
  return (
    left.start_date.slice(0, 10) ===
      right.start_date.slice(0, 10) &&
    left.end_date.slice(0, 10) ===
      right.end_date.slice(0, 10) &&
    normalizeTripIdentityText(
      left.country
    ) ===
      normalizeTripIdentityText(
        right.country
      ) &&
    getTripNameSimilarity(
      left.name,
      right.name
    ) >= 80
  )
}
