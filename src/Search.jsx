import { useEffect, useMemo, useRef, useState } from 'react'

const PROXY_BASE = '/api'
const DROPDOWN_COUNT = 32

function Search({ onSelect }) {
  const [query, setQuery] = useState('')
  const [maps, setMaps] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [scrollCount, setScrollCount] = useState(1)
  const containerRef = useRef(null)

  useEffect(() => {
    const loadMaps = async () => {
      try {
        const response = await fetch(`${PROXY_BASE}/stats`)
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
    const source = normalizedQuery
      ? maps.filter(({ name }) => name.toLowerCase().includes(normalizedQuery))
      : maps

    return source.slice(0, DROPDOWN_COUNT * scrollCount)
  }, [maps, query, scrollCount])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleQueryChange = (value) => {
    setQuery(value)
    setScrollCount(1)
    setIsOpen(true)
  }

  const handleSelect = (nextMapName) => {
    onSelect?.(nextMapName, { immediate: true })
    setQuery(nextMapName)
    setScrollCount(1)
    setIsOpen(false)
  }

  const handleScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget

    if (scrollTop + clientHeight >= scrollHeight - 24) {
      setScrollCount((prev) => prev + 1)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (filteredMaps[0]) {
        handleSelect(filteredMaps[0].name)
      }
    }
  }

  return (
    <div className="search-container" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Enter map name"
      />

      {isOpen && filteredMaps.length > 0 && (
        <div
          className="search-dropdown"
          onScroll={handleScroll}
        >
          {filteredMaps.map((map) => (
            <button
              key={map.name}
              className="search-option"
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
                handleSelect(map.name)
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
