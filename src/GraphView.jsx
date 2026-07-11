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
      color: getNodeColor(node),
    })
  })
}

function getNodeColor(node) {
  if (node.read) {
    return 'gray'
  }

  if (isOffensive(node.comment)) {
    return 'red'
  }

  return 'PaleTurquoise'
}

function GraphView({ nodes, markRead }) {
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const rendererRef = useRef(null)

  useEffect(() => {
    graphRef.current = new Graph()

    const sigmaOptions = {
      renderEdgeLabels: false,
      renderLabels: false,
      labelRenderedSizeThreshold: 0,
      defaultNodeType: 'circle',
      defaultEdgeType: 'line',
      minCameraRatio: 0.1,
      maxCameraRatio: 4,
    }

    rendererRef.current = new Sigma(
      graphRef.current,
      containerRef.current,
      sigmaOptions
    )

    return () => {
      rendererRef.current?.kill()
    }
  }, [])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph) return

    graph.clear()

    if (!Array.isArray(nodes) || nodes.length === 0) {
      graph.addNode("seed", {
        label: "No echoes yet",
        x: 0,
        y: 0,
        size: 1,
        color: "#7dd3fc",
      })
    } else {
      setGraphNodes(graph, nodes)
    }

    rendererRef.current.refresh()
  }, [nodes])
  
  useEffect(() => {
    const renderer = rendererRef.current
    const graph = graphRef.current
    if (!renderer || !graph) return

    const handleEnterNode = ({ node }) => {
      graph.setNodeAttribute(node, 'enterHover', performance.now())
    }

    const handleLeaveNode = ({ node }) => {
      const leaveHover = performance.now()
      const enteredAt = graph.getNodeAttribute(node, 'enterHover') || 0

      if (leaveHover - enteredAt >= 200 && markRead) {
        markRead(node)
        graph.setNodeAttribute(node, 'read', true)
        graph.setNodeAttribute(node, 'color', 'gray')
        renderer.refresh()
      }
    }

    renderer.on('enterNode', handleEnterNode)
    renderer.on('leaveNode', handleLeaveNode)

    return () => {
      renderer.off('enterNode', handleEnterNode)
      renderer.off('leaveNode', handleLeaveNode)
    }
  }, [markRead])

  return <div className="graph-layer" ref={containerRef} />
}

export default GraphView
