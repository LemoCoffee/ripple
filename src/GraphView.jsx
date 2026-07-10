import { useEffect, useRef } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import { isOffensive } from './filter.js'

function setGraphNodes(graph, nodes) {
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
      color: isOffensive(node.comment) ? 'red' : 'PaleTurquoise',
    })
  })
}

function GraphView({ nodes }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const graph = new Graph()

    if (!Array.isArray(nodes) || nodes.length === 0) {
      graph.addNode('seed', {
        label: 'No echoes yet',
        x: 0,
        y: 0,
        size: 1,
        color: '#7dd3fc',
      })
    } else {
      setGraphNodes(graph, nodes)
    }

    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      renderLabels: false,
      nodeLabelRenderer: (node, data, context, settings) => {
        const label = data.label || ''
        const maxWidth = 140
        const words = label.split(/(\s+)/).filter(Boolean)
        const lines = []
        let currentLine = ''

        context.fillStyle = settings.labelColor === 'node' ? data.color : settings.defaultLabelColor
        context.font = `${settings.labelWeight} ${data.size}px ${settings.labelFont}`

        words.forEach((word) => {
          const candidate = currentLine ? `${currentLine}${word}` : word
          const metrics = context.measureText(candidate)

          if (metrics.width <= maxWidth || currentLine === '') {
            currentLine = candidate
          } else {
            lines.push(currentLine)
            currentLine = word
          }
        })

        if (currentLine) {
          lines.push(currentLine)
        }

        const lineHeight = data.size + 2
        lines.forEach((line, index) => {
          context.fillText(
            line,
            data.x + data.size + 3,
            data.y + lineHeight * index - ((lines.length - 1) * lineHeight) / 2,
          )
        })
      },
      labelRenderedSizeThreshold: 0,
      defaultNodeType: 'circle',
      defaultEdgeType: 'line',
      minCameraRatio: 0.1,
      maxCameraRatio: 4,
    })

    return () => renderer.kill()
  }, [nodes])

  return <div className="graph-layer" ref={containerRef} />
}

export default GraphView
