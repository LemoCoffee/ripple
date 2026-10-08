import { useEffect, useRef } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import { isOffensive } from './filter.js'

function setGraphNodes(graph, nodes, showExplicit, readIds) {
  if (!graph || !Array.isArray(nodes)) {
    return
  }

  nodes.forEach((node) => {
    const position = Array.isArray(node?.position) ? node.position : []
    node.offensive = isOffensive(node.comment)
    node.read = readIds?.has(String(node.id)) ?? false

    graph.addNode(String(node.id), {
      label: node.comment || 'Echo',
      x: position[0] ?? 0,
      y: position[1] ?? 0,
      size: 2,
      color: getNodeColor(node),
      baseColor: getNodeColor(node),
      timestamp: node.created,
      explicit: node.offensive,
      hidden: node.offensive && !showExplicit
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

function formatTimestamp(timestamp) {
  if (!timestamp) return null

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null

  const day = date.getUTCDate()
  const daySuffix = day % 100 >= 11 && day % 100 <= 13
    ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th')
  const month = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    timeZone: 'UTC',
  }).format(date)
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')

  return `${month} ${day}${daySuffix}, ${date.getUTCFullYear()} - ${hours}:${minutes}`
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
    whiteSpace: 'pre-line',
    overflowWrap: 'anywhere',
    textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
    padding: '20px 32px',
    boxSizing: 'content-box',
    background: 'radial-gradient(ellipse farthest-side at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.75) 65%, rgba(0, 0, 0, 0) 100%)',
    pointerEvents: 'none',
    userSelect: 'text',
    cursor: 'text',
    opacity: '0',
    transition: `opacity ${FADE_MS}ms ease`,
  })
  return el
}

function GraphView({ nodes, markRead, readIds, settings }) {
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const rendererRef = useRef(null)
  const markReadRef = useRef(markRead)
  const settingsRef = useRef(settings)
  const readIdsRef = useRef(readIds)
  const tooltipRef = useRef(null)
  const hoveredRef = useRef(null)

  // markRead is recreated every App render; keeping it in a ref lets the hover
  // effect run once, so re-renders can't cancel an in-flight fade or tooltip
  useEffect(() => {
    markReadRef.current = markRead
  }, [markRead])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    readIdsRef.current = readIds
  }, [readIds])

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
        size: 0,
        color: "#7dd3fc",
      })
    } else {
      setGraphNodes(graph, nodes, settingsRef.current?.showExplicitEchoes, readIdsRef.current)
    }

    const renderer = rendererRef.current
    if (!renderer) return
    renderer.refresh()
    renderer.getCamera().setState({ x: 0.5, y: 0.5, angle: 0, ratio: 1 })
    renderer.getCamera().animatedReset()
  }, [nodes])

  // Toggling explicit echoes only hides/shows nodes; hidden nodes are neither rendered nor hoverable
  useEffect(() => {
    const graph = graphRef.current
    const renderer = rendererRef.current
    if (!graph || !renderer) return

    graph.forEachNode((node, attributes) => {
      if (attributes.explicit === undefined) return
      graph.setNodeAttribute(node, 'hidden', attributes.explicit && !settings?.showExplicitEchoes)
    })
    renderer.refresh()
  }, [settings?.showExplicitEchoes])
  
  useEffect(() => {
    const renderer = rendererRef.current
    const graph = graphRef.current
    if (!renderer || !graph) return

    const container = renderer.getContainer()
    const tooltip = createTooltip()
    tooltipRef.current = tooltip
    container.appendChild(tooltip)

    let hovered = null
    let pinned = null
    const anims = new Map()
    let frame = null

    const positionTooltip = () => {
      const shown = pinned ?? hovered
      if (!shown || !graph.hasNode(shown)) return
      const { x, y } = renderer.graphToViewport({
        x: graph.getNodeAttribute(shown, 'x'),
        y: graph.getNodeAttribute(shown, 'y'),
      })
      const size = graph.getNodeAttribute(shown, 'size') || 2
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
      if (pinned === null) {
        hoveredRef.current = node
        updateTooltipText(tooltip, graph, node, settingsRef.current?.showTimestamps)
        positionTooltip()
        tooltip.style.opacity = '1'
      }
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
      if (hovered === node) hovered = null
      if (pinned === null && hoveredRef.current === node) {
        tooltip.style.opacity = '0'
        hoveredRef.current = null
      }
      if (pinned === node) return
      const base = graph.getNodeAttribute(node, 'baseColor') || 'PaleTurquoise'
      fadeNodeTo(node, toRgb(base))
    }

    const unpin = () => {
      if (pinned === null) return
      const node = pinned
      pinned = null
      hoveredRef.current = hovered
      tooltip.style.pointerEvents = 'none'
      if (hovered !== null && graph.hasNode(hovered)) {
        updateTooltipText(tooltip, graph, hovered, settingsRef.current?.showTimestamps)
        positionTooltip()
      } else {
        tooltip.style.opacity = '0'
      }
      if (node !== hovered && graph.hasNode(node)) {
        fadeNodeTo(node, toRgb(graph.getNodeAttribute(node, 'baseColor') || 'PaleTurquoise'))
      }
    }

    const handleClickNode = ({ node }) => {
      if (pinned === node) return
      const previous = pinned
      pinned = node
      hoveredRef.current = node
      updateTooltipText(tooltip, graph, node, settingsRef.current?.showTimestamps)
      positionTooltip()
      tooltip.style.opacity = '1'
      tooltip.style.pointerEvents = 'auto'
      window.getSelection()?.removeAllRanges()
      if (previous !== null && previous !== hovered && graph.hasNode(previous)) {
        fadeNodeTo(previous, toRgb(graph.getNodeAttribute(previous, 'baseColor') || 'PaleTurquoise'))
      }
      fadeNodeTo(node, WHITE)
    }

    // Clicks inside the tooltip never reach Sigma's mouse canvas, so selecting text keeps it open
    renderer.on('clickNode', handleClickNode)
    renderer.on('clickStage', unpin)
    renderer.on('enterNode', handleEnterNode)
    renderer.on('leaveNode', handleLeaveNode)
    renderer.on('afterRender', positionTooltip)

    return () => {
      renderer.off('clickNode', handleClickNode)
      renderer.off('clickStage', unpin)
      renderer.off('enterNode', handleEnterNode)
      renderer.off('leaveNode', handleLeaveNode)
      renderer.off('afterRender', positionTooltip)
      if (frame !== null) cancelAnimationFrame(frame)
      tooltip.remove()
      tooltipRef.current = null
      hoveredRef.current = null
    }
  }, [])

  useEffect(() => {
    const showTimestamps = settings?.showTimestamps
    const node = hoveredRef.current
    const graph = graphRef.current
    const tooltip = tooltipRef.current
    if (!node || !graph?.hasNode(node) || !tooltip) return

    updateTooltipText(tooltip, graph, node, showTimestamps)
    rendererRef.current?.refresh()
  }, [settings?.showTimestamps])

  return <div className="graph-layer" ref={containerRef} />
}

function updateTooltipText(tooltip, graph, node, showTimestamps) {
  const label = graph.getNodeAttribute(node, 'label')
  const timestamp = showTimestamps
    ? formatTimestamp(graph.getNodeAttribute(node, 'timestamp'))
    : null
  tooltip.textContent = timestamp ? `${label}\n${timestamp}` : label
}

export default GraphView
