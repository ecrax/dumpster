import { useDataStore } from "~/lib/zustand/data";
import { useGameStore } from "~/lib/zustand/game";
import { BACKGROUND_OFFSET, CAM_SCALE } from "../constants";
import { getKaplayCtx } from "../core/kaplayCtx";
import {
  addBackgrounds,
  addGameobjects,
  animPlayer,
  handleReset,
} from "../utils/gameHelper";

export const initializePlayground = () => {
  const { k, game } = getKaplayCtx();

  addBackgrounds(["background1"]);

  const { raccoon, trashcanFilled, goalFlag } = addGameobjects([
    "raccoon",
    "trashcanFilled",
    "goalFlag",
  ]);
  k.setCamPos(0, -BACKGROUND_OFFSET);
  k.setCamScale((CAM_SCALE * k.height()) / 947);

  game.onUpdate(() => {
    if (useGameStore.getState().isPaused) return;

    animPlayer(raccoon!, k);

    trashcanFilled!.pos.x =
      useDataStore.getState().gameObjects.get("trashcanFilled")?.get("xpos")
        ?.value ?? 0;
    trashcanFilled!.pos.y =
      useDataStore.getState().gameObjects.get("trashcanFilled")?.get("ypos")
        ?.value ?? 0;

    if (useDataStore.getState().initData) {
      handleReset(raccoon!, 1);
    }
  });
};
