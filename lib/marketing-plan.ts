export type NewMarketingPlanItem = {
  planned_date: string
  channel: string
  title: string
  notes: string | null
}

export function getMarketingPlanItems(
  formData: FormData
): NewMarketingPlanItem[] {
  const plannedDates = formData
    .getAll('planned_date')
    .map((value) => String(value).trim())

  const channels = formData
    .getAll('channel')
    .map((value) => String(value).trim())

  const titles = formData
    .getAll('title')
    .map((value) => String(value).trim())

  const notes = formData
    .getAll('notes')
    .map((value) => String(value).trim())

  if (
    plannedDates.length === 0 ||
    plannedDates.length > 20 ||
    channels.length !== plannedDates.length ||
    titles.length !== plannedDates.length ||
    notes.length !== plannedDates.length
  ) {
    throw new Error(
      'Lisää 1–20 markkinointisuoritetta.'
    )
  }

  return plannedDates.map((plannedDate, index) => {
    const channel = channels[index]
    const title = titles[index]

    if (!plannedDate || !channel || !title) {
      throw new Error(
        `Täytä suoritteen ${index + 1} päivämäärä, kanava ja toimenpide.`
      )
    }

    return {
      planned_date: plannedDate,
      channel,
      title,
      notes: notes[index] || null,
    }
  })
}
