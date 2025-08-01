import { CrossCircledIcon } from "@radix-ui/react-icons";
import { Position, useReactFlow } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo } from "react";

import { LEVELS, type ModifiableGameObject } from "~/lib/game/core/levels";
import type { GameObject } from "~/lib/game/game-objects";
import { useDataStore } from "~/lib/zustand/data";
import { useGameStore } from "~/lib/zustand/game";
import { useGameobjectSelect } from "../../hooks/useGameobjectSelect";
import AddHandle from "../../node-components/AddHandle";
import BaseHandle from "../../node-components/BaseHandle";
import LabelHandle from "../../node-components/LabelHandle";
import MultiSelectDropDown from "../../node-components/MultiSelectDropDown";
import NodeContent from "../../node-components/NodeContent";
import type { nodeInputs } from "../../node-store/node-store";
import { getInput } from "../../utils/compute";
import { getDisplayName } from "../../utils/display";
import { getHandleIntersection } from "../../utils/handles";
import { IN_HANDLE_1 } from "../constants";

/**
 * React component that allows node data to be written to one or more
 * GameObjects in the game state.
 *
 * Features:
 * - Multi-select dropdown for choosing one or more GameObjects.
 * - Input handle for index selection if multiple GameObjects are selected.
 * - Automatically displays an intersection of input handles for all selected GameObjects.
 * - Allows dynamic addition/removal of input handles per GameObject field.
 *
 * Props:
 * @param {string} id - Node instance ID from the ReactFlow context.
 * @param {any} data - Node data object. It may include:
 *   - `selectedGameObjects`: Array of GameObject IDs.
 *   - `curLabel`: `useRef` to the label input for new handles.
 * @param {boolean} selected - Whether the node is currently selected (for styling).
 *
 * Hooks/Stores Used:
 * - `useGameStore`: Accesses the current game level and available GameObjects.
 * - `useDataStore`: Reads and writes values to specific GameObject fields.
 * - `useGameobjectSelect`: Manages multi-select dropdown logic.
 * - `useReactFlow`: Updates the node's `compute` function dynamically.
 *
 * Behavior:
 * - If an upstream node is connected to the index input handle, its value is rounded using `Math.round`.
 *
 * UI Notes:
 * - A red `CrossCircledIcon` appears next to fields which were added by the user, allowing users to remove these fields.
 * - `AddHandle` allows dynamically adding new labeled input handles for writing.
 *
 */
const ExportToGameobject = memo(
  ({ id, data, selected }: { id: string; data: any; selected: boolean }) => {
    const level = useGameStore((state) => state.currentLevel);
    const modifiableGameObjects: ModifiableGameObject[] =
      LEVELS[level].modifiableGameObjects;

    const gameObjects = useDataStore((state) => state.gameObjects);
    const selectableGameObjects: GameObject[] = Array.from(gameObjects.keys());

    const callbackDisplayName = useCallback(
      (gameObject: GameObject) =>
        getDisplayName(gameObject, modifiableGameObjects),
      [modifiableGameObjects]
    );

    const {
      isOpen,
      getToggleButtonProps,
      getMenuProps,
      getLabelProps,
      highlightedIndex,
      getItemProps,
      selectedGameObjects,
      handleReorder,
    } = useGameobjectSelect(
      selectableGameObjects,
      data.selectedGameObjects
        ? data.selectedGameObjects
        : [selectableGameObjects[0]],
      id
    );

    const handleIntersection = useMemo(
      () => getHandleIntersection("export", gameObjects, selectedGameObjects),
      [gameObjects, selectedGameObjects]
    );

    const setData = useDataStore((state) => state.setData);
    const addHandle = useDataStore((state) => state.addHandle);
    const removeHandle = useDataStore((state) => state.removeHandle);

    const { updateNodeData } = useReactFlow();

    useEffect(() => {
      updateNodeData(id, {
        compute: (inputs: nodeInputs) => {
          const index =
            selectedGameObjects.length === 1
              ? 0
              : Math.round(getInput(inputs, IN_HANDLE_1, -1));

          if (0 > index || index >= selectedGameObjects.length) return;

          const gob = selectedGameObjects[index];
          handleIntersection.forEach((handle) => {
            setData(gob, handle, getInput(inputs, handle, 0));
          });
        },
        selectedGameObjects,
      });
    }, [handleIntersection]);

    return (
      <div>
        <NodeContent
          label="Export To Gameobject"
          type="export"
          docsName="export"
        >
          <div className="text-left">
            {selectedGameObjects.length > 1 && (
              <BaseHandle id={IN_HANDLE_1} position={Position.Left} />
            )}
            <MultiSelectDropDown
              highlightedIndex={highlightedIndex}
              isOpen={isOpen}
              selectableObjects={selectableGameObjects}
              selectedObjects={selectedGameObjects}
              onReorder={handleReorder}
              getDisplayName={callbackDisplayName}
              useSelectProps={{
                getItemProps: getItemProps,
                getLabelProps: getLabelProps,
                getMenuProps: getMenuProps,
                getToggleButtonProps: getToggleButtonProps,
              }}
            />
          </div>
          {handleIntersection.map((label) => (
            <div
              className={
                "flex w-full items-center [&>*:nth-child(even)]:pointer-events-none [&>*:nth-child(even)]:opacity-0 hover:[&>*:nth-child(even)]:pointer-events-auto hover:[&>*:nth-child(even)]:opacity-100 " +
                (selected ? "hover:bg-slate-800" : "hover:bg-slate-700")
              }
              key={label}
            >
              <LabelHandle
                key={label}
                id={label}
                position={Position.Left}
                label={label}
              />
              {!modifiableGameObjects.some(
                ({ id, connections }) =>
                  selectedGameObjects.includes(id) &&
                  connections.some((connection) => connection.label === label)
              ) && (
                <CrossCircledIcon
                  className="mt-[1px] ml-2 cursor-pointer text-red-400"
                  onClick={() => {
                    selectedGameObjects.forEach((gameObject) =>
                      removeHandle(gameObject, label)
                    );
                  }}
                />
              )}
            </div>
          ))}
          {!!selectedGameObjects.length && (
            <AddHandle
              handleIdentifiers={selectedGameObjects}
              nodeId={id}
              initialLabel={data.handleLabel ?? ""}
              addHandle={(id, label) => addHandle(id as GameObject, label)}
            />
          )}
        </NodeContent>
      </div>
    );
  }
);

export default ExportToGameobject;
