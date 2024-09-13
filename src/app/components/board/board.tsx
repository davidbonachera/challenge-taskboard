"use client";

import { useEffect } from "react";
import { useBoardStore } from "@/app/stores/board";
import { Column } from "@/app/components/board/column";
import { ICard } from "@/app/models/card";

export const Board = ({ initialCards }: { initialCards: ICard[] }) => {
    const { cards, setCards, loadBoardFromLocalStorage } = useBoardStore();

    useEffect(() => {
        loadBoardFromLocalStorage();

        if (initialCards.length > 0) {
            setCards(initialCards);
        }
    }, [initialCards, loadBoardFromLocalStorage, setCards]);

    const columns = [
        { title: 'Backlog', status: 'BACKLOG' },
        { title: 'To-do', status: 'TODO' },
        { title: 'Doing', status: 'DOING' },
        { title: 'Done', status: 'DONE' },
    ];

    return (
        <div className="grid lg:grid-cols-4 gap-5">
            {columns.map((column) => (
                <Column
                    key={column.status}
                    title={column.title}
                    status={column.status}
                    cards={cards.filter((card) => card && card.status === column.status)}
                />
            ))}
        </div>
    );
};