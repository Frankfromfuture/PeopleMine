'use client'

import React, { useMemo, useState } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { JourneyPathData } from '@/lib/journey/types'

interface JourneyGraphProps {
  pathData: JourneyPathData
  onNodeClick?: (nodeId: string) => void
  selectedNodeId?: string | null
}

interface NodeData {
  label: string
  role: string
  score: number
  isOnPrimaryPath?: boolean
}

// 自定义用户节点
function UserNode() {
  return (
    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-violet-600 text-white font-bold text-xl shadow-lg">
      你
    </div>
  )
}

// 自定义联系人节点
function ContactNode({
  data,
  selected,
}: {
  data: NodeData
  selected: boolean
}) {
  const size = Math.min(70, Math.max(40, 40 + data.score * 30))
  const roleColors: Record<string, string> = {
    BIG_INVESTOR: 'bg-amber-400',
    GATEWAY: 'bg-blue-400',
    ADVISOR: 'bg-violet-400',
    THERMOMETER: 'bg-rose-400',
    LIGHTHOUSE: 'bg-orange-400',
    COMRADE: 'bg-green-400',
  }

  const color = roleColors[data.role] || 'bg-gray-400'
  const borderClass = data.isOnPrimaryPath
    ? 'border-4 border-amber-300 shadow-xl'
    : 'border-2 border-gray-300'
  const opacityClass = data.isOnPrimaryPath ? '' : 'opacity-60'

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-full text-white font-semibold text-xs cursor-pointer transition-all ${color} ${borderClass} ${opacityClass} ${selected ? 'ring-4 ring-violet-500' : ''}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <div className="text-center px-1">{data.label}</div>
    </div>
  )
}

// 自定义缺失节点
function MissingNode({ data }: { data: NodeData }) {
  return (
    <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-dashed border-gray-400 bg-gray-50 text-gray-600 font-semibold text-xs text-center p-1">
      {data.label}?
    </div>
  )
}

export const nodeTypes = {
  userNode: UserNode,
  contactNode: ContactNode,
  missingNode: MissingNode,
}


export default function JourneyGraph({
  pathData,
  onNodeClick,
  selectedNodeId,
}: JourneyGraphProps) {
  const [layoutMode, setLayoutMode] = useState<'radial' | 'linear'>('radial')

  // 构建节点
  const nodes = useMemo(() => {
    const primaryPathIds = pathData.primaryPath.map((s) => s.contactId)
    const nodeList: Node[] = [
      {
        id: 'user',
        data: { label: '你' },
        position: { x: 0, y: 0 },
        type: 'userNode',
        draggable: false,
      },
    ]

    // 主路径节点
    pathData.primaryPath.forEach((step, index) => {
      const node = pathData.nodes.find((n) => n.contactId === step.contactId)
      if (node) {
        nodeList.push({
          id: step.contactId,
          data: {
            label: node.name,
            role: node.relationRole,
            score: node.journeyScore,
            isOnPrimaryPath: true,
          },
          position:
            layoutMode === 'radial'
              ? {
                  x: 200 * Math.cos((2 * Math.PI * index) / Math.max(1, pathData.primaryPath.length) - Math.PI / 2),
                  y: 200 * Math.sin((2 * Math.PI * index) / Math.max(1, pathData.primaryPath.length) - Math.PI / 2),
                }
              : { x: (index + 1) * 250, y: 0 },
          type: 'contactNode',
          selected: selectedNodeId === step.contactId,
          draggable: false,
        })
      }
    })

    // 其他高分节点
    const otherNodes = pathData.nodes
      .filter((n) => !primaryPathIds.includes(n.contactId) && n.journeyScore >= 0.3)
      .slice(0, 6)

    otherNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / Math.max(1, otherNodes.length) - Math.PI / 2
      nodeList.push({
        id: node.contactId,
        data: {
          label: node.name,
          role: node.relationRole,
          score: node.journeyScore,
          isOnPrimaryPath: false,
        },
        position: {
          x: 380 * Math.cos(angle),
          y: 380 * Math.sin(angle),
        },
        type: 'contactNode',
        selected: selectedNodeId === node.contactId,
        draggable: false,
      })
    })

    // 缺失节点
    pathData.missingNodes.forEach((missing, index) => {
      const angle = (2 * Math.PI * (index + otherNodes.length)) / Math.max(1, otherNodes.length + pathData.missingNodes.length) - Math.PI / 2
      nodeList.push({
        id: `missing-${missing.missingRole}`,
        data: { label: missing.roleName },
        position: {
          x: 380 * Math.cos(angle),
          y: 380 * Math.sin(angle),
        },
        type: 'missingNode',
        draggable: false,
      })
    })

    return nodeList
  }, [pathData, layoutMode, selectedNodeId])

  // 构建边
  const edges = useMemo(() => {
    const edgeList: Edge[] = []

    // 用户到第一个节点
    if (pathData.primaryPath.length > 0) {
      edgeList.push({
        id: `user-to-first`,
        source: 'user',
        target: pathData.primaryPath[0].contactId,
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 3 },
      })

      // 主路径的连接
      for (let i = 0; i < pathData.primaryPath.length - 1; i++) {
        edgeList.push({
          id: `path-${i}-to-${i + 1}`,
          source: pathData.primaryPath[i].contactId,
          target: pathData.primaryPath[i + 1].contactId,
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 2.5 },
        })
      }
    }

    return edgeList
  }, [pathData.primaryPath])

  const [nodesState, setNodesState] = useNodesState(nodes)
  const [edgesState] = useEdgesState(edges)

  React.useEffect(() => {
    setNodesState(nodes)
  }, [nodes, setNodesState])

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.id !== 'user' && !node.id.startsWith('missing-')) {
      onNodeClick?.(node.id)
    }
  }

  return (
    <div className="relative w-full h-[520px] rounded-xl border border-gray-200 overflow-hidden bg-white">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background />
        <Controls position="top-right" />
        <MiniMap />
      </ReactFlow>

      {/* 布局切换按钮 */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-10">
        <button
          onClick={() => setLayoutMode('radial')}
          className={`px-3 py-1 text-sm rounded transition ${
            layoutMode === 'radial'
              ? 'bg-violet-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          辐射布局
        </button>
        <button
          onClick={() => setLayoutMode('linear')}
          className={`px-3 py-1 text-sm rounded transition ${
            layoutMode === 'linear'
              ? 'bg-violet-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          线性路径
        </button>
      </div>
    </div>
  )
}
