import { useEffect, useRef, useState } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import './App.css'
import {isOffensive} from './filter.js'

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

function SetGraphNodes(graph, nodes) {
  if (!graph || !Array.isArray(nodes)) {
    return
  }

  nodes.forEach((node) => {
    const position = Array.isArray(node?.position) ? node.position : []

    graph.addNode(String(node.id), {
      label: node.comment || 'Echo',
      x: position[0] ?? 0,
      y: position[1] ?? 0,
      size: 2,
      color: ((isOffensive(node.comment)) ? 'Red' : 'PaleTurquoise'),
    })
  })
}

function App() {
  const [authToken, setAuthToken] = useState("")
  const [selectedMap, setSelectedMap] = useState("ctf_applejack")
  const [mapInput, setMapInput] = useState(selectedMap)
  const [mapEchoes, setMapEchoes] = useState([])
  const graphContainerRef = useRef(null)

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

  useEffect(() => {
    if (!graphContainerRef.current) return

    const graph = new Graph()

    if (mapEchoes.length === 0) {
      graph.addNode('seed', {
        label: 'No echoes yet',
        x: 0,
        y: 0,
        size: 1,
        color: '#7dd3fc',
      })
    } else {
      SetGraphNodes(graph, mapEchoes || [])
    }

    var sumX = 0;
    var sumY = 0;
    var numNodes = graph.order;

    graph.forEachNode((node, attributes) => {
        sumX += attributes.x;
        sumY += attributes.y;
    });

    const renderer = new Sigma(graph, graphContainerRef.current, {
      renderEdgeLabels: false,
      renderLabels: false,
      nodeLabelRenderer: (node, data, context, settings) => {
        const label = data.label || "";
        const maxWidth = 140;
        const words = label.split(/(\s+)/).filter(Boolean);
        const lines = [];
        let currentLine = "";

        context.fillStyle = settings.labelColor === "node" ? data.color : settings.defaultLabelColor;
        context.font = `${settings.labelWeight} ${data.size}px ${settings.labelFont}`;

        words.forEach((word) => {
          const candidate = currentLine ? `${currentLine}${word}` : word;
          const metrics = context.measureText(candidate);

          if (metrics.width <= maxWidth || currentLine === "") {
            currentLine = candidate;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        });

        if (currentLine) {
          lines.push(currentLine);
        }

        const lineHeight = data.size + 2;
        lines.forEach((line, index) => {
          context.fillText(
            line,
            data.x + data.size + 3,
            data.y + (lineHeight * index) - ((lines.length - 1) * lineHeight / 2)
          );
        });
      },
      labelRenderedSizeThreshold: 0,
      defaultNodeType: 'circle',
      defaultEdgeType: 'line',
      minCameraRatio: 0.1,
      maxCameraRatio: 4,
    })

    /*renderer.getCamera().setState({
        x: sumX / numNodes,
        y: sumY / numNodes,
        ratio: 1
    });*/
    console.log('Camera pos: (' + sumX / numNodes + ', ' + sumY / numNodes + ')')

    return () => renderer.kill()
  }, [mapEchoes])

  return (
    <div className="app">
      <div className="graph-layer" ref={graphContainerRef} />
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
