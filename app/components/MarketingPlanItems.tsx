'use client'

import { useRef, useState } from 'react'

type MarketingPlanItemsProps = {
  channelNames: string[]
  defaultDate: string
}

type PlanItem = {
  id: number
}

export default function MarketingPlanItems({
  channelNames,
  defaultDate,
}: MarketingPlanItemsProps) {
  const nextId = useRef(2)
  const [items, setItems] = useState<PlanItem[]>([
    { id: 1 },
  ])

  function addItem() {
    const id = nextId.current
    nextId.current += 1

    setItems((currentItems) => [
      ...currentItems,
      { id },
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

              <div className="plan-item-grid">
                <div className="plan-field">
                  <label htmlFor={dateId}>
                    Päivämäärä <span className="required-mark">*</span>
                  </label>

                  <input
                    id={dateId}
                    name="planned_date"
                    type="date"
                    defaultValue={defaultDate}
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
                    defaultValue=""
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
