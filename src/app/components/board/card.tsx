"use client";

import React from "react";
import {ICard} from "@/app/models/card";

interface CardProps {
    card: ICard;
    onMove: () => void;
    onMoveBack: () => void;
    onDelete: () => void;
}

export const Card: React.FC<CardProps> = ({card, onMove, onMoveBack, onDelete}) => {
    const isDone = card.status === "DONE";

    return (
        <div
            className={`p-3 rounded shadow-sm ${
                isDone ? "bg-gray-200 opacity-40 cursor-not-allowed" : "bg-gray-100"
            }`}
        >

            <div className={"flex justify-between"}>
                <h3 className={`text-md font-semibold ${isDone ? "text-gray-500" : ""}`}>
                    {card.title}
                </h3>
                {!isDone && (
                    <button
                        className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10"
                        onClick={onDelete}
                    >
                        Delete
                    </button>
                )}
            </div>
            <p className={`text-sm ${isDone ? "text-gray-400" : "text-gray-600"}`}>
                {card.description}
            </p>
            <div className="mt-2 flex justify-between">
                {card.status !== "BACKLOG" && !isDone && (
                    <button
                        className="text-blue-500 text-sm"
                        onClick={onMoveBack}
                    >
                        Move to Previous
                    </button>
                )}
                <div></div>
                {card.status !== "DONE" && (
                    <button
                        className="text-blue-500 text-sm"
                        onClick={onMove}
                    >
                        Move to Next
                    </button>
                )}
            </div>
        </div>
    );
};
