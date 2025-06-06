import { DialogClose } from "@radix-ui/react-dialog";
import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";

import { useGameStore } from "~/lib/zustand/game";
import { LEVELS } from "../core/levels";
import CustomDialog from "./CustomDialog";

const LevelDialog = ({
  open,
  onOpenChange,
  skip = false,
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  skip?: boolean;
  trigger?: React.ReactNode;
}) => {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const goals = LEVELS[currentLevel]?.goals || [
    "No goals defined for this level yet.",
  ];
  const dialogs = LEVELS[currentLevel]?.dialog || [
    "No dialog available for this level.",
  ];

  const index = useRef(0);

  const [typedText, setTypedText] = useState("");
  const [dialog, setDialog] = useState(dialogs[index.current]);

  const [showingGoals, setShowingGoals] = useState(skip);

  // Typing effect
  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      if (index <= dialog.length) {
        setTypedText(dialog.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 10);

    return () => {
      clearInterval(interval);
      setTypedText("");
    };
  }, [dialog]);

  useEffect(() => {
    index.current = 0;
    setDialog(dialogs[0]);
    setShowingGoals(skip);
    setTypedText("");
  }, [currentLevel]);

  const startButtonRef = useRef<HTMLButtonElement>(null);

  /* Function to handle the "Next" button click */
  const handleNext = () => {
    if (!showingGoals) {
      if (index.current < dialogs.length - 1) {
        index.current++;
        setDialog(dialogs[index.current]);
      } else {
        index.current = 0;
        setShowingGoals(true);
        setTimeout(() => {
          startButtonRef.current?.focus();
        }, 0);
        setDialog("");
      }
    }
  };

  /* Function to handle the "Previous" button click */
  const handlePrevious = () => {
    if (showingGoals) {
      setShowingGoals(false);
      index.current = dialogs.length - 1;
      setDialog(dialogs[index.current]);
    } else if (index.current > 0) {
      index.current--;
      setDialog(dialogs[index.current]);
    }
  };

  return (
    <CustomDialog
      title={currentLevel}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      desc={`This dialog displays the level goals and instructions for the
            ${currentLevel} level. You can close it by clicking the close button or
            pressing the escape key.`}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-1 flex-row">
          {/* Left side: Raccoon sprite */}
          <div className="my-auto w-1/3">
            <div
              style={{
                aspectRatio: "7 / 6",
                width: "100%",
                backgroundImage: "url('/game/sprites/raccoon_spritesheet.png')",
                backgroundPosition: "0 0",
                backgroundSize: "400% 400%",
                backgroundRepeat: "no-repeat",
                imageRendering: "pixelated",
              }}
            ></div>
          </div>

          {/* Right side: Description text */}
          <div className="relative my-auto h-36 w-full rounded-lg bg-slate-700 p-4 text-white shadow-lg">
            <div className="absolute top-1/2 -left-2.5 h-0 w-0 -translate-y-1/2 border-t-10 border-r-10 border-b-10 border-t-transparent border-r-slate-700 border-b-transparent"></div>
            <p className="h-full overflow-auto pr-2 text-lg italic [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-900">
              {showingGoals ? (
                <>
                  <span className="not-italic">Goals:</span>
                  {goals.map((goal) => (
                    <li key={goal.slice(0, 20)} className="text-lg italic">
                      {goal}
                    </li>
                  ))}
                </>
              ) : (
                typedText
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-row justify-end gap-5">
          <button
            onClick={handlePrevious}
            disabled={showingGoals ? false : index.current === 0}
            className={classNames(
              "rounded-lg bg-slate-700/80 px-3 py-2 focus:outline-1 focus:outline-blue-300",
              !showingGoals && index.current === 0
                ? "opacity-50"
                : "cursor-pointer hover:bg-slate-600"
            )}
          >
            Previous
          </button>
          {showingGoals ? (
            <DialogClose asChild>
              <button
                ref={startButtonRef}
                className="cursor-pointer rounded-lg bg-slate-700/80 px-3 py-2 hover:bg-slate-600 focus:outline-1 focus:outline-blue-300"
              >
                Start
              </button>
            </DialogClose>
          ) : (
            <button
              onClick={handleNext}
              className="cursor-pointer rounded-lg bg-slate-700/80 px-3 py-2 hover:bg-slate-600 focus:outline-1 focus:outline-blue-300"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </CustomDialog>
  );
};

export default LevelDialog;
