import { useEffect, useState } from 'react'
import './App.css'
import GraphView from './GraphView.jsx'
import Search from './Search.jsx'

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
    return data?.notes ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

function App() {
  const [authToken, setAuthToken] = useState("")
  const [selectedMap, setSelectedMap] = useState("ctf_applejack")
  const [mapInput, setMapInput] = useState(selectedMap)
  const [mapEchoes, setMapEchoes] = useState([])

  const loadMap = async (mapName) => {
    if (!mapName) { return }

    const echoes = await FetchMap(mapName, authToken)
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

  return (
    <div className="app">
      <GraphView nodes={mapEchoes} markRead={markRead} />
      <div className="input-panel">
        <Search onSelect={(selectedMapName, options = {}) => {
          setMapInput(selectedMapName)
          setSelectedMap(selectedMapName)

          if (options.immediate) {
            loadMap(selectedMapName)
          }
        }} />
      </div>
    </div>
  )
}

export default App
