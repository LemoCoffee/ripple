import { useEffect, useMemo, useRef, useState } from 'react'

function Search({ onSelect }) {
  const [query, setQuery] = useState('')
  const [maps, setMaps] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const loadMaps = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        const mapEntries = Object.entries(data.maps || {})
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        setMaps(mapEntries)
      } catch (error) {
        console.error(error)
      }
    }

    loadMaps()
  }, [])

  const filteredMaps = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return maps.slice(0, 8)
    }

    return maps
      .filter(({ name }) => name.toLowerCase().includes(normalizedQuery))
      .slice(0, 8)
  }, [maps, query])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (filteredMaps[0]) {
        onSelect?.(filteredMaps[0].name, { immediate: true })
        setQuery(filteredMaps[0].name)
        setIsOpen(false)
      }
    }
  }

  return (
    <div className="search-container" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Enter map name"
      />

      {isOpen && filteredMaps.length > 0 && (
        <div
          className="search-dropdown"
          onMouseLeave={() => setIsOpen(false)}
        >
          {filteredMaps.map((map) => (
            <button
              key={map.name}
              className="search-option"
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
                onSelect?.(map.name, { immediate: true })
                setQuery(map.name)
                setIsOpen(false)
              }}
            >
              <span>{map.name}</span>
              <span className="search-count">{map.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Search
