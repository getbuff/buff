"use client";

import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
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
  type Connection,
} from "@xyflow/react";
import * as SubframeCore from "@subframe/core";
import { WorkflowPageLayout } from "@/layouts/WorkflowPageLayout";
import {
  nodeTypes,
  FinicNodeType,
  configurationDrawerTypes,
  FinicNode,
  NodeIcons,
  NodeResults,
} from "../../types";
import "@xyflow/react/dist/style.css";
import { useParams, useNavigate } from "react-router-dom";
import useWorkflow from "@/hooks/useWorkflow";
import { useUserStateContext } from "@/hooks/useAuth";
import { useWorkflowRun } from "@/hooks/useWorkflowRun";
import {
  SourceNodeConfigurationDrawer,
  DestinationNodeConfigurationDrawer,
  TransformationNodeConfigurationDrawer,
} from "@/components/ConfigurationDrawer";

const initialNodes = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: {
      name: "example_source_node",
      configuration: { sourceType: "google_cloud_storage" },
    },
    type: "source",
  },
  {
    id: "2",
    position: { x: 500, y: 0 },
    data: { name: "example_source_node" },
    type: "transformation",
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
  const { id: workflowId } = useParams();
  const navigate = useNavigate();
  const store = useStoreApi();
  const { unselectNodesAndEdges } = store.getState();
  const { bearer } = useUserStateContext();
  const { getWorkflow, deleteWorkflow, updateNodesAndEdges, updateNodeConfig } =
    useWorkflow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState("draft");

  const {
    runWorkflowAndPoll,
    workflowRunLoading,
    workflowRun,
    getWorkflowRunAndPoll,
  } = useWorkflowRun(bearer, workflowId!);

  function renderWorkflowResults(workflowRun: any) {
    // Mapping of node id to results
    const results = workflowRun.results;

    // Update each node with the results
    const updatedNodes = nodes.map((node) => {
      if (node.id in results) {
        const nodeResults: NodeResults = {
          columns: results[node.id][0],
          data: results[node.id].slice(1),
        };

        return { ...node, data: { ...node.data, results: nodeResults } };
      }
      return node as any;
    });
    setNodes(updatedNodes);
  }

  useEffect(() => {
    if (workflowRun) {
      console.log("workflowRun", workflowRun);
      // renderWorkflowResults(workflowRun);
    }
  }, [workflowRun]);

  useEffect(() => {
    if (bearer && workflowId) {
      getWorkflow(bearer, workflowId!).then((data) => {
        if (data && "id" in data) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setWorkflowName(data.name);
          setWorkflowStatus(data.status);
        } else {
          console.error("Failed to get workflow: ", data);
        }
      });
      getWorkflowRunAndPoll();
    }
  }, [bearer, workflowId]);

  useOnSelectionChange({
    onChange: useCallback(({ nodes, edges }) => {
      if (nodes.length === 0) {
        setSelectedNode(null);
        setSelectedEdge(null);
        setIsDrawerOpen(false);
      } else {
        setSelectedNode(nodes[0]);
        setSelectedEdge(null);
        setIsDrawerOpen(true);
      }
    }, []),
  });

  const handleConnectNodes = (connection: Connection) => {
    const newEdge = {
      id: uuidv4(),
      source: connection.source,
      target: connection.target,
    };
    setEdges([...edges, newEdge]);
    updateNodesAndEdges(bearer, workflowId!, nodes, [...edges, newEdge]);
  };

  function handleAddNode(nodeType: FinicNodeType) {
    const newNode: Node = {
      id: uuidv4(),
      position: { x: 0, y: 500 },
      data: {
        name: "New Node",
      },
      type: nodeType,
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    updateNodesAndEdges(bearer, workflowId!, newNodes, edges);
  }

  function handleDeleteNode(nodesToDelete: Node[]) {
    updateNodesAndEdges(
      bearer,
      workflowId!,
      nodes.filter((node) => !nodesToDelete.includes(node)),
      edges
    );
  }

  function handleDeleteEdge(edgesToDelete: Edge[]) {
    updateNodesAndEdges(
      bearer,
      workflowId!,
      nodes,
      edges.filter((edge) => !edgesToDelete.includes(edge))
    );
  }

  function handleDeleteWorkflow() {
    deleteWorkflow(bearer, workflowId!).then((data) => {
      if ("id" in data) {
        navigate("/");
      } else {
        console.error("Failed to delete workflow: ", data);
      }
    });
  }

  function handleRepositionNode(
    event: React.MouseEvent,
    _node: Node,
    __nodes: Node[]
  ) {
    updateNodesAndEdges(bearer, workflowId!, nodes, edges);
  }

  function handleNodeConfigurationUpdate(nodeId: string, configuration: any) {
    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, configuration } };
      }
      return node;
    });
    setNodes(updatedNodes);
    updateNodeConfig(bearer, workflowId!, nodeId, configuration);
  }

  function handleRenameWorkflow(newName: string) {
    //
  }

  function handleDuplicateNode(nodeId: string) {
    //
  }

  function closeDrawer() {
    unselectNodesAndEdges({ nodes: [selectedNode!] });
  }

  function renderWorkflow() {
    return (
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={handleDeleteNode}
        onNodeDragStop={handleRepositionNode}
        onConnect={handleConnectNodes}
        onEdgesDelete={handleDeleteEdge}
        selectNodesOnDrag={false}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    );
  }

  function renderConfigurationDrawer() {
    switch (selectedNode!.type) {
      case "source":
        return (
          <SourceNodeConfigurationDrawer
            nodeData={selectedNode!.data}
            nodeId={selectedNode!.id}
            closeDrawer={() => closeDrawer()}
            iconName={
              NodeIcons[selectedNode!.type as keyof SubframeCore.IconName]
            }
            updateNodeConfiguration={handleNodeConfigurationUpdate}
          />
        );
      case "destination":
        return (
          <DestinationNodeConfigurationDrawer
            nodeData={selectedNode!.data}
            nodeId={selectedNode!.id}
            closeDrawer={() => closeDrawer()}
            iconName={
              NodeIcons[selectedNode!.type as keyof SubframeCore.IconName]
            }
            updateNodeConfiguration={handleNodeConfigurationUpdate}
          />
        );
      case "transformation":
        return (
          <TransformationNodeConfigurationDrawer
            nodeData={selectedNode!.data}
            nodeId={selectedNode!.id}
            closeDrawer={() => closeDrawer()}
            iconName={
              NodeIcons[selectedNode!.type as keyof SubframeCore.IconName]
            }
            updateNodeConfiguration={handleNodeConfigurationUpdate}
          />
        );
    }
  }

  return (
    <WorkflowPageLayout
      addNode={handleAddNode}
      deleteWorkflow={handleDeleteWorkflow}
      workflowRunLoading={workflowRunLoading}
      runWorkflow={runWorkflowAndPoll}
    >
      <div className="flex h-full w-full flex-col items-start bg-default-background">
        <div className="flex w-full h-full flex-wrap items-start mobile:flex-col mobile:flex-wrap mobile:gap-0">
          <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-2 self-stretch bg-neutral-50 mobile:border mobile:border-solid mobile:border-neutral-border mobile:pt-12 mobile:pr-12 mobile:pb-12 mobile:pl-12">
            {nodes.length > 0 ? (
              renderWorkflow()
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
          {selectedNode && renderConfigurationDrawer()}
        </div>
      </div>
    </WorkflowPageLayout>
  );
}