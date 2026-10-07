import { useEffect, useRef, useState } from 'react'
import './App.css'
import GraphView from './GraphView.jsx'
import Search from './Search.jsx'
import Menu from './Menu.jsx'

const PROXY_BASE = '/api'
const REPO_URL = 'https://github.com/LemoCoffee/ripple'

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
  const [showAbout, setShowAbout] = useState(false)
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
    setMapEchoes(echoes)
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
  }, [mapInput, authToken])

  const openMenu = (menuName) => {
    setActiveMenu(menuName)
    if (menuName === 'settings') setShowSettings(true)
    if (menuName === 'credits') setShowCredits(true)
    if (menuName === 'about') setShowAbout(true)
  }

  const closeMenu = () => {
    setActiveMenu(null)
    setShowSettings(false)
    setShowCredits(false)
    setShowAbout(false)
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
        <button type="button" className="floating-menu-button about" onClick={() => openMenu('about')}>
          About
        </button>
        <button type="button" className="floating-menu-button" onClick={() => openMenu('settings')}>
          Settings
        </button>
        <button type="button" className="floating-menu-button" onClick={() => openMenu('credits')}>
          Credits
        </button>
        <a
          className="floating-menu-button icon"
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
          title="GitHub repository"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
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

      <Menu title="About" open={showAbout} onClose={closeMenu} mode="credits">
        <p className="menu-text">
          Ripple is a web app for reading player messages (echoes) left in the
          Garry's Mod addon Echoes Beyond. 
          <br></br>
          Search for a map to see its echoes as an interactive
          graph, and click an echo to read it &lt;3
        </p>
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
        <div className="menu-row">
          <span>Made by</span>
          <span className="menu-value"><a href="https://github.com/LemoCoffee">LemoCoffee</a></span>
        </div>
      </Menu>
    </div>
  )
}

export default App
