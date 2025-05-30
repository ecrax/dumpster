import { Position, useReactFlow } from "@xyflow/react";
import { memo, useEffect } from "react";

import { useTimeStore } from "~/lib/zustand/time";
import LabelHandle from "../../node-components/LabelHandle";
import NodeContent from "../../node-components/NodeContent";
import type { nodeData, nodeInputs } from "../../node-store/node-store";
import { OUT_HANDLE_1, OUT_HANDLE_2 } from "../constants";

const Time = memo(({ id }: { id: string }) => {
  const { updateNodeData } = useReactFlow();
  const getTime = useTimeStore((state) => state.getTime);
  const getDeltaTime = useTimeStore((state) => state.getDeltaTime);

  useEffect(() => {
    updateNodeData(id, {
      compute: (_: nodeInputs, results: nodeData) => {
        results.set(OUT_HANDLE_1, getTime());
        results.set(OUT_HANDLE_2, getDeltaTime());
      },
    });
  }, []);

  return (
    <div className="min-w-48">
      <NodeContent label="Time" type="float" docsName="time">
        <LabelHandle id={OUT_HANDLE_1} position={Position.Right} label="Time" />
        <LabelHandle
          id={OUT_HANDLE_2}
          position={Position.Right}
          label="Delta time"
        />
      </NodeContent>
    </div>
  );
});

export default Time;
