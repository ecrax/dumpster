import { useFlowStore } from "~/lib/node-editor/node-store/flow-store";
import { useLoopStore } from "~/lib/node-editor/node-store/loop-store";
import { useNodeStore } from "~/lib/node-editor/node-store/node-store";
import { useDataStore } from "~/lib/zustand/data";
import { useGameStore } from "~/lib/zustand/game";
import { LEVELS } from "./levels";

/**
 * Initializes the level by calling the initialState function of the level.
 * @param level Name of the level to load.
 */
export const loadLevel = (level: keyof typeof LEVELS) => {
  const curLevel = LEVELS[level];

  // initialize all stores with level data
  useGameStore.getState().init(level);
  useFlowStore.getState().init(level);
  useNodeStore.getState().init(level);
  useLoopStore.getState().init(level);
  useDataStore.getState().init(level);

  curLevel.initialState();
};
