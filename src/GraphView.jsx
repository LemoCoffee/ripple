import { useEffect, useRef } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import { isOffensive } from './filter.js'

function setGraphNodes(graph, nodes, settings) {
  if (!graph || !Array.isArray(nodes)) {
    return
  }

  nodes.forEach((node) => {
    const position = Array.isArray(node?.position) ? node.position : []
    node.offensive = isOffensive(node.comment)

    graph.addNode(String(node.id), {
      label: node.comment || 'Echo',
      x: position[0] ?? 0,
      y: position[1] ?? 0,
      size: 2,
      color: getNodeColor(node),
      baseColor: getNodeColor(node),
      hidden: node.offensive && !settings?.showExplicitEchoes
    })
  })
}

function getNodeColor(node) {
  if (node.read) {
    return 'gray'
  }

  if (node.offensive) {
    return 'red'
  }

  return 'PaleTurquoise'
}

const WHITE = [255, 255, 255]
const FADE_MS = 250
const TOOLTIP_MAX_WIDTH = 220
const TOOLTIP_GAP = 10

const colorCtx = document.createElement('canvas').getContext('2d')

function toRgb(color) {
  colorCtx.fillStyle = '#000'
  colorCtx.fillStyle = color
  const hex = colorCtx.fillStyle
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  return (hex.match(/\d+/g) || [128, 128, 128]).slice(0, 3).map(Number)
}

function createTooltip() {
  const el = document.createElement('div')
  Object.assign(el.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    maxWidth: `${TOOLTIP_MAX_WIDTH}px`,
    width: 'max-content',
    textAlign: 'center',
    color: '#fff',
    font: '14px system-ui, sans-serif',
    lineHeight: '1.3',
    overflowWrap: 'anywhere',
    textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
    pointerEvents: 'none',
    opacity: '0',
    transition: `opacity ${FADE_MS}ms ease`,
  })
  return el
}

function GraphView({ nodes, markRead, settings = { showExplicitEchoes: true } }) {
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const rendererRef = useRef(null)
  const markReadRef = useRef(markRead)

  // markRead is recreated every App render; keeping it in a ref lets the hover
  // effect run once, so re-renders can't cancel an in-flight fade or tooltip
  useEffect(() => {
    markReadRef.current = markRead
  }, [markRead])

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
      // Sigma's built-in hover box is replaced by the DOM tooltip below
      defaultDrawNodeHover: () => {},
    }

    rendererRef.current = new Sigma(
      graphRef.current,
      containerRef.current,
      sigmaOptions
    )

    return () => {
      rendererRef.current?.kill()
      rendererRef.current = null
      graphRef.current = null
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
      setGraphNodes(graph, nodes, settings)
    }

    const renderer = rendererRef.current
    if (!renderer) return
    renderer.refresh()
    renderer.getCamera().setState({ x: 0.5, y: 0.5, angle: 0, ratio: 1 })
    renderer.getCamera().animatedReset()
  }, [nodes, settings])
  
  useEffect(() => {
    const renderer = rendererRef.current
    const graph = graphRef.current
    if (!renderer || !graph) return

    const container = renderer.getContainer()
    const tooltip = createTooltip()
    container.appendChild(tooltip)

    let hovered = null
    const anims = new Map()
    let frame = null

    const positionTooltip = () => {
      if (!hovered || !graph.hasNode(hovered)) return
      const { x, y } = renderer.graphToViewport({
        x: graph.getNodeAttribute(hovered, 'x'),
        y: graph.getNodeAttribute(hovered, 'y'),
      })
      const size = graph.getNodeAttribute(hovered, 'size') || 2
      // Sigma's canvases may not share the container's origin, so offset from the canvas
      const canvasRect = renderer.getCanvases().mouse.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const left = x + canvasRect.left - containerRect.left
      const top = y + canvasRect.top - containerRect.top
      tooltip.style.transform = `translate(${left}px, ${top - size - TOOLTIP_GAP}px) translate(-50%, -100%)`
    }

    const tick = (now) => {
      frame = null
      anims.forEach((anim, node) => {
        if (!graph.hasNode(node)) {
          anims.delete(node)
          return
        }
        const p = Math.min(1, (now - anim.start) / FADE_MS)
        const rgb = anim.from.map((c, i) => Math.round(c + (anim.to[i] - c) * p))
        graph.setNodeAttribute(node, 'color', `rgb(${rgb.join(',')})`)
        if (p >= 1) anims.delete(node)
      })
      renderer.refresh({ skipIndexation: true })
      if (anims.size > 0) frame = requestAnimationFrame(tick)
    }

    const fadeNodeTo = (node, target) => {
      anims.set(node, {
        from: toRgb(graph.getNodeAttribute(node, 'color')),
        to: target,
        start: performance.now(),
      })
      if (frame === null) frame = requestAnimationFrame(tick)
    }

    const handleEnterNode = ({ node }) => {
      graph.setNodeAttribute(node, 'enterHover', performance.now())
      hovered = node
      tooltip.textContent = graph.getNodeAttribute(node, 'label')
      positionTooltip()
      tooltip.style.opacity = '1'
      fadeNodeTo(node, WHITE)
    }

    const handleLeaveNode = ({ node }) => {
      const leaveHover = performance.now()
      const enteredAt = graph.getNodeAttribute(node, 'enterHover') || 0

      if (leaveHover - enteredAt >= 200 && markReadRef.current) {
        markReadRef.current(node)
        graph.setNodeAttribute(node, 'read', true)
        graph.setNodeAttribute(node, 'baseColor', 'gray')
      }

      // Tooltip keeps its last position/text while it fades out
      if (hovered === node) tooltip.style.opacity = '0'
      const base = graph.getNodeAttribute(node, 'baseColor') || 'PaleTurquoise'
      fadeNodeTo(node, toRgb(base))
    }

    renderer.on('enterNode', handleEnterNode)
    renderer.on('leaveNode', handleLeaveNode)
    renderer.on('afterRender', positionTooltip)

    return () => {
      renderer.off('enterNode', handleEnterNode)
      renderer.off('leaveNode', handleLeaveNode)
      renderer.off('afterRender', positionTooltip)
      if (frame !== null) cancelAnimationFrame(frame)
      tooltip.remove()
    }
  }, [])

  return <div className="graph-layer" ref={containerRef} />
}

export default GraphView
