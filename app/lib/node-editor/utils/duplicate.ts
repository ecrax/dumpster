import type { Edge, Node } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";

import { useLoopStore } from "../node-store/loop-store";
import { MAIN_LOOP_CONNECTOR } from "../nodes/constants";
import { connectionToEdgeId } from "./edges";
import { connectNodesToLoop, createForLoop } from "./loops";

// this accepts a list of nodes and duplicates them
// loops and groups will be handled automatically, just include them and their children
export function duplicateNodes(
  nodes: Node[],
  getEdges: () => Edge[],
  getNodes: () => Node[],
  setEdges: (payload: Edge[] | ((edges: Edge[]) => Edge[])) => void,
  setNodes: (payload: Node[] | ((nodes: Node[]) => Node[])) => void
) {
  // if this is called with no nodes, return
  if (!nodes || nodes.length === 0) return;

  // this map will keep track of which new parent ids should be assigned to children
  const oldToNewIdMap = new Map<string, string>();
  const newNodes: Node[] = [];
  const newEdges: Edge[] = [];
  // create copies of group nodes
  const groupNodes: Node[] = nodes.filter((node) => node.type === "Group");
  newNodes.push(
    ...groupNodes.map((node) => {
      const newId = uuidv4();
      oldToNewIdMap.set(node.id, newId);

      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        data: {
          ...node.data,
        },
      };
    })
  );

  // loop nodes and how they are nested
  const loopStartNodes: Node[] = nodes.filter(
    (node) => node.type === "ForStart"
  );
  const loopEndNodes: Node[] = nodes.filter((node) => node.type === "ForEnd");

  type loop = { start: Node; end: Node };
  const loops: loop[] = [];
  loopStartNodes.forEach((node) => {
    const endNode = loopEndNodes.find(
      (endNode) => endNode.data.loopId === node.data.loopId
    );
    if (endNode) {
      loops.push({ start: node, end: endNode });
    }
  });

  // duplicate the loops
  loops.forEach((loop) => {
    const loopBox = createForLoop(
      // startPosition
      {
        x:
          loop.start.parentId && oldToNewIdMap.has(loop.start.parentId)
            ? loop.start.position.x
            : loop.start.position.x + 50,
        y:
          loop.start.parentId && oldToNewIdMap.has(loop.start.parentId)
            ? loop.start.position.y
            : loop.start.position.y + 50,
      },
      // endPosition
      {
        x:
          loop.end.parentId && oldToNewIdMap.has(loop.end.parentId)
            ? loop.end.position.x
            : loop.end.position.x + 50,
        y:
          loop.end.parentId && oldToNewIdMap.has(loop.end.parentId)
            ? loop.end.position.y
            : loop.end.position.y + 50,
      },
      oldToNewIdMap.get(loop.start.data.parentLoopId as string) ??
        (loop.start.data.parentLoopId as string),
      oldToNewIdMap.get(loop.start.parentId as string) ?? loop.start.parentId,
      oldToNewIdMap.get(loop.end.parentId as string) ?? loop.end.parentId
    );

    newNodes.push(...loopBox.nodes);
    newEdges.push(loopBox.mainConnectorEdge);

    oldToNewIdMap.set(loop.start.id, loopBox.startId);
    oldToNewIdMap.set(loop.end.id, loopBox.endId);
    oldToNewIdMap.set(loop.start.data.loopId as string, loopBox.id);
  });

  // duplicate all other nodes
  const otherNodes = nodes.filter(
    (node) =>
      node.type !== "Group" &&
      node.type !== "ForStart" &&
      node.type !== "ForEnd"
  );
  otherNodes.forEach((node) => {
    const newId = uuidv4();
    oldToNewIdMap.set(node.id, newId);

    newNodes.push({
      ...node,
      id: newId,
      parentId: node.parentId
        ? (oldToNewIdMap.get(node.parentId) ?? node.parentId)
        : undefined,
      position: {
        x:
          node.parentId && oldToNewIdMap.has(node.parentId)
            ? node.position.x
            : node.position.x + 50,
        y:
          node.parentId && oldToNewIdMap.has(node.parentId)
            ? node.position.y
            : node.position.y + 50,
      },
      data: {
        ...node.data,
        parentLoopId:
          oldToNewIdMap.get(node.data.parentLoopId as string) ??
          node.data.parentLoopId,
      },
    });
  });

  // handles copying of handles from the old loop to the new loop
  const addHandle = useLoopStore.getState().addHandle;
  const getHandles = useLoopStore.getState().getHandles;
  loops.forEach((loop) => {
    const newLoopId = oldToNewIdMap.get(loop.start.data.loopId as string);
    if (!newLoopId) return;
    const loopHandles = getHandles(loop.start.data.loopId as string);
    loopHandles.forEach((oldHandleId, label) => {
      const newHandleId = addHandle(newLoopId, label);
      oldToNewIdMap.set(oldHandleId, newHandleId);
    });
  });

  // set the new nodes
  setNodes((nodes) => {
    const updatedNodes = nodes.concat(newNodes);
    return updatedNodes.map((node) => ({
      ...node,
      selected: Array.from(oldToNewIdMap.values()).includes(node.id),
    }));
  });

  // handles edges from new nodes to their parent loops regardless wether the loop is new or not
  newNodes.forEach((node) => {
    if (node.type === "Group") return;
    if (node.data.parentLoopId === undefined) return;

    const oldParentLoopNodes = getNodes()
      .concat(newNodes)
      .filter(
        (n) => (n.data.loopId as string) === (node.data.parentLoopId as string)
      );

    newEdges.push(...connectNodesToLoop(oldParentLoopNodes, [node.id]));
  });

  // filter for remaining relevant edges
  const relevantEdges = getEdges().filter((edge) => {
    // if the edge is a loop connector, its already handled
    if (
      edge.sourceHandle === MAIN_LOOP_CONNECTOR ||
      edge.targetHandle === MAIN_LOOP_CONNECTOR
    ) {
      return false;
    }
    // if the edges source and target are in the oldToNewIdMap, it is relevant
    return oldToNewIdMap.has(edge.source) && oldToNewIdMap.has(edge.target);
  });

  relevantEdges.forEach((edge) => {
    const newSourceId = oldToNewIdMap.get(edge.source);
    const newTargetId = oldToNewIdMap.get(edge.target);

    const newSourceHandle =
      oldToNewIdMap.get(edge.sourceHandle ?? "") ?? edge.sourceHandle ?? null;
    const newTargetHandle =
      oldToNewIdMap.get(edge.targetHandle ?? "") ?? edge.targetHandle ?? null;

    if (!newSourceId || !newTargetId) return;
    const newEdgeId = connectionToEdgeId({
      source: newSourceId,
      sourceHandle: newSourceHandle,
      target: newTargetId,
      targetHandle: newTargetHandle,
    });

    newEdges.push({
      ...edge,
      id: newEdgeId,
      type: edge.type,
      source: newSourceId,
      target: newTargetId,
      sourceHandle: newSourceHandle,
      targetHandle: newTargetHandle,
      animated: edge.animated ?? false,
      selectable: edge.selectable ?? true,
      style: {
        ...edge.style,
      },
    });
  });

  // set the new edges
  setEdges((edges) => {
    const updatedEdges = edges.concat(newEdges);
    return updatedEdges.map((edge) => ({
      ...edge,
    }));
  });
}
