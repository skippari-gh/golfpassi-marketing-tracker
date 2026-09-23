'use client'

import { useState } from 'react'

type Destination = {
  id: string
  name: string
  country: string
  defaultChecked?: boolean
}

export default function DestinationSelector({
  destinations,
}: {
  destinations: Destination[]
}) {
  const [selected, setSelected] = useState(
    destinations.filter((destination) => destination.defaultChecked).map((destination) => destination.id)
  )

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    )
  }

  const selectedDestinations = destinations.filter((destination) => selected.includes(destination.id))

  return (
    <>
      <div className="destination-checkboxes">
        {destinations.map((destination) => (
          <label className="destination-checkbox" key={destination.id}>
            <input
              type="checkbox"
              name="destination_id"
              value={destination.id}
              checked={selected.includes(destination.id)}
              onChange={(event) => toggle(destination.id, event.target.checked)}
            />
            <span>
              <strong>{destination.name}</strong>
              <small>{destination.country}</small>
            </span>
          </label>
        ))}
      </div>

      <div className="selected-destinations" aria-live="polite">
        <strong>Valitut kohteet ({selectedDestinations.length})</strong>
        {selectedDestinations.length ? (
          <ul>
            {selectedDestinations.map((destination) => (
              <li key={destination.id}>{destination.name}</li>
            ))}
          </ul>
        ) : (
          <p>Ei vielä valittuja kohteita.</p>
        )}
      </div>
    </>
  )
}
