'use client'

import { useRef, useState } from 'react'

type MarketingPlanItemsProps = {
  channelNames: string[]
  defaultDate: string
}

type PlanItem = {
  id: number
  plannedDate: string
  channel: string
  title: string
  notes: string
}

export default function MarketingPlanItems({
  channelNames,
  defaultDate,
}: MarketingPlanItemsProps) {
  const nextId = useRef(2)
  const [items, setItems] = useState<PlanItem[]>([
    { id: 1, plannedDate: defaultDate, channel: '', title: '', notes: '' },
  ])

  function addItem() {
    const id = nextId.current
    nextId.current += 1

    setItems((currentItems) => [
      ...currentItems,
      { id, plannedDate: defaultDate, channel: '', title: '', notes: '' },
    ])
  }

  function updateItem(id: number, patch: Partial<Omit<PlanItem, 'id'>>) {
    setItems((currentItems) =>
      currentItems.map((item) => item.id === id ? { ...item, ...patch } : item)
    )
  }

  function duplicateItem(item: PlanItem) {
    const id = nextId.current
    nextId.current += 1
    setItems((currentItems) => [
      ...currentItems,
      { ...item, id },
    ])
  }

  function removeItem(id: number) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    )
  }

  return (
    <fieldset className="plan-items-fieldset">
      <legend>Markkinointisuoritteet</legend>

      <p className="plan-items-intro">
        Lisää samalle matkalle kaikki suunnitellut kanavat ja
        toimenpiteet. Jokainen suorite saa oman päivänsä.
      </p>

      <div className="plan-items-list">
        {items.map((item, index) => {
          const itemNumber = index + 1
          const dateId = `planned_date_${item.id}`
          const channelId = `channel_${item.id}`
          const titleId = `title_${item.id}`
          const notesId = `notes_${item.id}`

          return (
            <section className="plan-item" key={item.id}>
              <div className="plan-item-heading">
                <h3>Suorite {itemNumber}</h3>

                <div className="plan-item-actions">
                  <button
                    className="plan-item-duplicate"
                    type="button"
                    onClick={() => duplicateItem(item)}
                    disabled={items.length >= 20}
                  >
                    Duplikoi
                  </button>

                {items.length > 1 ? (
                  <button
                    className="plan-item-remove"
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Poista suorite ${itemNumber}`}
                  >
                    Poista
                  </button>
                ) : null}
                </div>
              </div>

              <div className="plan-item-grid">
                <div className="plan-field">
                  <label htmlFor={dateId}>
                    Päivämäärä <span className="required-mark">*</span>
                  </label>

                  <input
                    id={dateId}
                    name="planned_date"
                    type="date"
                    value={item.plannedDate}
                    onChange={(event) => updateItem(item.id, { plannedDate: event.target.value })}
                    required
                  />
                </div>

                <div className="plan-field">
                  <label htmlFor={channelId}>
                    Kanava <span className="required-mark">*</span>
                  </label>

                  <select
                    id={channelId}
                    name="channel"
                    value={item.channel}
                    onChange={(event) => updateItem(item.id, { channel: event.target.value })}
                    required
                  >
                    <option value="">Valitse kanava</option>

                    {channelNames.map((channelName) => (
                      <option key={channelName} value={channelName}>
                        {channelName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="plan-field">
                <label htmlFor={titleId}>
                  Toimenpide <span className="required-mark">*</span>
                </label>

                <input
                  id={titleId}
                  name="title"
                  type="text"
                  placeholder="Esimerkiksi uutiskirjenosto tai Facebook-postaus"
                  value={item.title}
                  onChange={(event) => updateItem(item.id, { title: event.target.value })}
                  required
                />
              </div>

              <div className="plan-field">
                <label htmlFor={notesId}>Lisätiedot</label>

                <textarea
                  id={notesId}
                  name="notes"
                  rows={3}
                  placeholder="Sisältöidea, aineistot tai muut huomiot"
                  value={item.notes}
                  onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                />
              </div>
            </section>
          )
        })}
      </div>

      <button
        className="button secondary plan-item-add"
        type="button"
        onClick={addItem}
        disabled={items.length >= 20}
      >
        + Lisää toinen suorite
      </button>
    </fieldset>
  )
}
