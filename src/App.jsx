import { useEffect, useState } from 'react'
import './App.css'
import GraphView from './GraphView.jsx'

async function FetchMap(mapName, authToken) {
  const url = '/api/note/view?map=' + encodeURIComponent(mapName)

  console.log('Fetching map at : ' + url)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authToken,
      },
    })

    const text = await response.text()
    return JSON.parse(text).notes
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
      const loadMap = async () => {
        if (!mapInput) { return }
        const echoes = await FetchMap(mapInput, authToken)
        setMapEchoes(echoes)
        setSelectedMap(mapInput)
        console.log(echoes)
      }

      loadMap()
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [mapInput, authToken])

  return (
    <div className="app">
      <GraphView nodes={mapEchoes} />
      <div className="input-panel">
        <input
          type="text"
          value={mapInput}
          onChange={(event) => setMapInput(event.target.value)}
          placeholder="Enter map name"
        />
      </div>
    </div>
  )
}

export default App
