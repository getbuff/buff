"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  useOnSelectionChange,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useStore,
  useStoreApi,
  addEdge,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import * as SubframeCore from "@subframe/core";
import { WorkflowPageLayout } from "@/layouts/WorkflowPageLayout";
import {
  nodeTypes,
  FinicNodeType,
  configurationDrawerTypes,
  NodeIcons,
} from "../../types";
import { ConfigurationDrawer } from "../../components/ConfigurationDrawer";
import "@xyflow/react/dist/style.css";
import { useParams } from "react-router-dom";

const initialNodes = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { title: "Example Source Node", description: "Test Description", sourceType: "gcs" },
    type: "source",
  },
  {
    id: "2",
    position: { x: 500, y: 0 },
    data: {
      title: "Example Destination Node",
      description: "Test Description",
      destinationType: "snowflake",
    },
    type: "destination",
  },
  {
    id: "3",
    position: { x: 1000, y: 0 },
    data: { title: "Example Mapping Node", description: "Test Description" },
    type: "mapping",
  },
  {
    id: "4",
    position: { x: 1500, y: 0 },
    data: { title: "Example Join Node", description: "Test Description" },
    type: "join",
  },
  {
    id: "5",
    position: { x: 2000, y: 0 },
    data: { title: "Example Split Node", description: "Test Description" },
    type: "split",
  },
  {
    id: "6",
    position: { x: 2500, y: 0 },
    data: { title: "Example Filter Node", description: "Test Description" },
    type: "filter",
  },
  {
    id: "7",
    position: { x: 3000, y: 0 },
    data: {
      title: "Example Conditional Node",
      description: "Test Description",
    },
    type: "conditional",
  },
  {
    id: "8",
    position: { x: 3500, y: 0 },
    data: {
      title: "Example Generative AI Node",
      description: "Test Description",
    },
    type: "generative_ai",
  },
  {
    id: "9",
    position: { x: 4000, y: 0 },
    data: { title: "Example Python Node", description: "Test Description" },
    type: "python",
  },
  {
    id: "10",
    position: { x: 4500, y: 0 },
    data: { title: "Example SQL Node", description: "Test Description" },
    type: "sql",
  },
];
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

const testResults = {
  columns: ["opportunity_id", "amount", "close_date", "is_closed", "is_won"],
  data: [
    [1, 1000, "2021-09-01", true, false],
    [2, 2000, "2021-09-02", false, true],
    [3, 3000, "2021-09-03", true, false],
    [4, 4000, "2021-09-04", false, true],
    [5, 5000, "2021-09-05", true, false],
    [6, 6000, "2021-09-06", false, true],
    [7, 7000, "2021-09-07", true, false],
    [8, 8000, "2021-09-08", false, true],
    [9, 9000, "2021-09-09", true, false],
    [10, 10000, "2021-09-10", false, true],
    [1, 1000, "2021-09-01", true, false],
    [2, 2000, "2021-09-02", false, true],
    [3, 3000, "2021-09-03", true, false],
    [4, 4000, "2021-09-04", false, true],
    [5, 5000, "2021-09-05", true, false],
    [6, 6000, "2021-09-06", false, true],
    [7, 7000, "2021-09-07", true, false],
    [8, 8000, "2021-09-08", false, true],
    [9, 9000, "2021-09-09", true, false],
    [10, 10000, "2021-09-10", false, true],
  ],
};

export default function WorkflowPage() {
  // const [nodes] = useState<Node[]>([]);
  const { id } = useParams();
  const store = useStoreApi();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Need to get the React Flow state in order to mark a node as selected when clicking the "Open" button
  const onNodeOpen = useCallback(
    (nodeId: string) => {
      console.log(store.getState());
      const { addSelectedNodes } = store.getState();
      addSelectedNodes([nodeId]);
    },
    [store]
  );

  const nodesWithData = initialNodes.map((node) => {
    return {
      ...node,
      data: { ...node.data, results: testResults, onNodeOpen: onNodeOpen },
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithData);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  useOnSelectionChange({
    onChange: useCallback(
      ({ nodes, edges }) => {
        console.log(nodes);
        if (nodes.length === 0) {
          setSelectedNode(null);
          setSelectedEdge(null);
          setIsDrawerOpen(false);
        } else {
          setSelectedNode(nodes[0]);
          setSelectedEdge(null);
          setIsDrawerOpen(true);
        }
      },
      [selectedNode]
    ),
  });

  const onConnect = useCallback(
    (params: any) => setEdges((edges) => addEdge(params, edges)),
    [setEdges]
  );

  function RenderWorkflow() {
    return (
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        selectNodesOnDrag={false}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    );
  }

  function addNode(nodeType: FinicNodeType) {
    console.log("add node");
    const newNode = {
      id: (nodes.length + 1).toString(),
      position: { x: 0, y: 500 },
      data: {
        title: "New Node",
        description: "New Node Description",
        onNodeOpen: onNodeOpen,
      },
      type: nodeType,
    };
    setNodes([...nodes, newNode]);
  }

  function closeDrawer() {
    setSelectedEdge(null);
    setSelectedNode(null);
    setIsDrawerOpen(false);
  }

  return (
    <WorkflowPageLayout addNode={addNode}>
      <div className="flex h-full w-full flex-col items-start bg-default-background">
        <div className="flex w-full h-full flex-wrap items-start mobile:flex-col mobile:flex-wrap mobile:gap-0">
          <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-2 self-stretch bg-neutral-50 mobile:border mobile:border-solid mobile:border-neutral-border mobile:pt-12 mobile:pr-12 mobile:pb-12 mobile:pl-12">
            {nodes.length > 0 ? (
              RenderWorkflow()
            ) : (
              <div className="flex flex-col items-center justify-center gap-4">
                <SubframeCore.Icon
                  className="text-heading-3 font-heading-3 text-subtext-color"
                  name="FeatherPlay"
                />
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-caption-bold font-caption-bold text-default-font">
                    Create your first workflow
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    Drag-and-drop a node to start
                  </span>
                </div>
              </div>
            )}
          </div>
          {selectedNode && (
            <ConfigurationDrawer
              className={isDrawerOpen ? undefined : "hidden"}
              closeDrawer={closeDrawer}
              title={selectedNode.data.title as string}
              description={selectedNode.data.description as string}
              nodeType={selectedNode.type as string}
              nodeData={selectedNode.data}
              iconName={
                NodeIcons[selectedNode.type as keyof SubframeCore.IconName]
              }
            />
          )}
        </div>
      </div>
    </WorkflowPageLayout>
  );
}
