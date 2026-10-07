import { useEffect, useRef, useState } from 'react'
import './App.css'
import GraphView from './GraphView.jsx'
import Search from './Search.jsx'
import Menu from './Menu.jsx'

const PROXY_BASE = '/api'

async function FetchMap(mapName, authToken) {
  const url = `${PROXY_BASE}/note/view?map=${encodeURIComponent(mapName)}`

  console.log('Fetching map at : ' + url)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authToken,
      },
    })

    const text = await response.text()
    const data = text ? JSON.parse(text) : {}

    console.log(mapName + ' responded with ' + data?.notes.length + ' echoes')
    
    return data?.notes ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

function App() {
  const [authToken, setAuthToken] = useState("")
  const [selectedMap, setSelectedMap] = useState("gm_construct")
  const [mapInput, setMapInput] = useState(selectedMap)
  const [mapEchoes, setMapEchoes] = useState([])
  const [activeMenu, setActiveMenu] = useState(null)
  const [showCredits, setShowCredits] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({ showExplicitEchoes: true })

  const latestRequest = useRef(0)

  const loadMap = async (mapName) => {
    if (!mapName) { return }

    const requestId = ++latestRequest.current
    setLoading(true)
    const echoes = await FetchMap(mapName, authToken)
    if (requestId !== latestRequest.current) { return }
    setLoading(false)
    const filteredEchoes = settings.showExplicitEchoes
      ? echoes
      : echoes.filter((echo) => !echo?.explicit)
    setMapEchoes(filteredEchoes)
    setSelectedMap(mapName)
  }

  const [readNoteIds, setReadNoteIds] = useState(() => {
    return JSON.parse(localStorage.getItem('readNoteIds') || '[]')
  })

  const markRead = (noteId) => {
    setReadNoteIds((prev) => {
      const next = [...new Set([...prev, noteId])]
      localStorage.setItem('readNoteIds', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadMap(mapInput)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [mapInput, authToken, settings.showExplicitEchoes])

  const openMenu = (menuName) => {
    setActiveMenu(menuName)
    if (menuName === 'settings') setShowSettings(true)
    if (menuName === 'credits') setShowCredits(true)
  }

  const closeMenu = () => {
    setActiveMenu(null)
    setShowSettings(false)
    setShowCredits(false)
  }

  return (
    <div className="app">
      <GraphView
        nodes={mapEchoes}
        markRead={markRead}
        settings={settings}
      />
      <div className={`loading-echo${loading ? ' visible' : ''}`} role="status" aria-label="Loading map" aria-hidden={!loading}>
        <svg viewBox="-50 -50 100 100">
          <polygon
            className="loading-echo-shape"
            points={Array.from({ length: 10 }, (_, i) => {
              const a = ((90 + 36 * i) * Math.PI) / 180
              return `${(48 * Math.cos(a)).toFixed(2)},${(-48 * Math.sin(a)).toFixed(2)}`
            }).join(' ')}
          />
          {[-14, 0, 14].map((x, i) => (
            <circle key={x} className="loading-echo-dot" cx={x} cy="0" r="5" style={{ animationDelay: `${i * 0.25}s` }} />
          ))}
        </svg>
      </div>
      <div className="input-panel">
        <Search onSelect={(selectedMapName, options = {}) => {
          setMapInput(selectedMapName)
          setSelectedMap(selectedMapName)

          if (options.immediate) {
            loadMap(selectedMapName)
          }
        }} />
      </div>

      <div className="floating-menu-buttons">
        <button type="button" className="floating-menu-button" onClick={() => openMenu('settings')}>
          Settings
        </button>
        <button type="button" className="floating-menu-button" onClick={() => openMenu('credits')}>
          Credits
        </button>
      </div>

      <Menu title="Settings" open={showSettings} onClose={closeMenu} mode="settings">
        <div className="menu-row">
          <span>Show explicit echoes</span>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.showExplicitEchoes}
              onChange={(event) => setSettings((prev) => ({ ...prev, showExplicitEchoes: event.target.checked }))}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </Menu>

      <Menu title="Credits" open={showCredits} onClose={closeMenu} mode="credits">
        <div className="menu-row">
          <span><a href="https://steamcommunity.com/sharedfiles/filedetails/?id=3432386791">Echoes Beyond</a></span>
          <span className="menu-value"><a href="https://github.com/Aspect12">Aspect™</a></span>
        </div>
        <div className="menu-row">
          <span></span>
          <span className="menu-value"><a href="https://github.com/patapancakes">Pancakes</a></span>
        </div>
        <div className="menu-row">
          <span>Data</span>
          <span className="menu-value"><a href="https://flatgrass.net">flatgrass.net</a></span>
        </div>
        <div className="menu-row">
          <span>Built with</span>
          <span className="menu-value"><a href="https://react.dev/">React + Vite</a></span>
        </div>
        <div className="menu-row">
          <span></span>
          <span className="menu-value"><a href="https://www.sigmajs.org/">sigma.js</a></span>
        </div>
        <div className="menu-row">
          <span>Special thanks</span>
          <span className="menu-value"><a href="https://intpotato.carrd.co/">IntellectualPotato</a></span>
        </div>
      </Menu>
    </div>
  )
}

export default App
