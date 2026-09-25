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
  const [query, setQuery] = useState('')

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    )
  }

  const selectedDestinations = destinations.filter((destination) => selected.includes(destination.id))
  const normalizedQuery = query.trim().toLocaleLowerCase('fi')
  const visibleDestinations = normalizedQuery
    ? destinations.filter((destination) =>
        `${destination.name} ${destination.country}`.toLocaleLowerCase('fi').includes(normalizedQuery)
      )
    : destinations

  return (
    <>
      <div className="destination-search">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Kirjoita kohteen tai maan nimi…"
          aria-label="Hae kohdetta"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="destination-search-clear">
            Tyhjennä
          </button>
        )}
      </div>

      <div className="destination-checkboxes">
        {visibleDestinations.map((destination) => (
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
        {visibleDestinations.length === 0 && (
          <p className="destination-no-results">Hakua vastaavaa kohdetta ei löytynyt.</p>
        )}
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
