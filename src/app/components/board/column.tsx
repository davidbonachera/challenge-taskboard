"use client";

import React, { useState } from "react";
import { CardStatus, ICard } from "@/app/models/card";
import { useBoardStore } from "@/app/stores/board";
import { Card } from "@/app/components/board/card";
import { ConfirmModal } from "@/app/components/modals/confirmModal";
import { CreateModal } from "@/app/components/modals/createModal";

interface ColumnProps {
    title: string;
    status: CardStatus | string;
    cards: ICard[];
}

export const Column: React.FC<ColumnProps> = ({ title, status, cards }) => {
    const { moveCard, createCard, deleteCard } = useBoardStore();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    const columnColors: { [index: string]: string } = {
        BACKLOG: "bg-red-100",
        TODO: "bg-blue-100",
        DOING: "bg-yellow-100",
        DONE: "bg-green-100",
    };

    const handleMoveToNext = (cardId: string) => {
        let newStatus: CardStatus;

        switch (status) {
            case CardStatus.BACKLOG:
                newStatus = CardStatus.TODO;
                break;
            case CardStatus.TODO:
                newStatus = CardStatus.DOING;
                break;
            case CardStatus.DOING:
                setSelectedCardId(cardId);
                setShowConfirmModal(true);
                return;
            default:
                return;
        }

        moveCard(cardId, newStatus);
    };

    const handleMoveToPrevious = (cardId: string) => {
        let newStatus: CardStatus;

        switch (status) {
            case CardStatus.TODO:
                newStatus = CardStatus.BACKLOG;
                break;
            case CardStatus.DOING:
                newStatus = CardStatus.TODO;
                break;
            case CardStatus.DONE:
                newStatus = CardStatus.DOING;
                break;
            default:
                return;
        }

        moveCard(cardId, newStatus);
    };

    const confirmMoveToDone = () => {
        if (selectedCardId) {
            moveCard(selectedCardId, CardStatus.DONE);
        }
        setShowConfirmModal(false);
        setSelectedCardId(null);
    };

    const cancelMoveToDone = () => {
        setShowConfirmModal(false);
        setSelectedCardId(null);
    };

    const handleDelete = (cardId: string) => {
        deleteCard(cardId);
    };

    const handleCreateTask = (title: string, description: string) => {
        createCard({
            title,
            description,
            status: status as CardStatus,
            board_id: "1",
        });
        setShowCreateModal(false);
    };

    return (
        <div className="bg-white rounded px-2 py-2 border-4 border-gray-100">
            <div className="flex flex-row justify-between items-center mb-2 mx-1">
                <div className="flex items-center">
                    <h2
                        className={`${columnColors[status]} text-sm w-max px-1 rounded mr-2 text-gray-700`}
                    >
                        {title}
                    </h2>
                    <p className="text-gray-400 text-sm">{cards.length}</p>
                </div>
            </div>

            <div className="grid grid-rows-2 gap-2">
                {cards.length > 0 ? (
                    cards.map((card: ICard) => (
                        <Card
                            key={card.id}
                            card={card}
                            onMove={() => handleMoveToNext(card.id)}
                            onMoveBack={() => handleMoveToPrevious(card.id)}
                            onDelete={() => handleDelete(card.id)}
                        />
                    ))
                ) : (
                    <p className="text-gray-500 text-sm">No tasks available</p>
                )}
            </div>
            <div
                className="flex flex-row items-center text-gray-300 mt-2 px-1 cursor-pointer"
                onClick={() => setShowCreateModal(true)}
            >
                <p className="rounded mr-2 text-2xl">+</p>
                <p className="pt-1 rounded text-sm">New</p>
            </div>

            {showConfirmModal && (
                <ConfirmModal
                    title="Confirm Move to Done"
                    message="Are you sure you want to move this card to Done? This action cannot be undone."
                    onConfirm={confirmMoveToDone}
                    onCancel={cancelMoveToDone}
                />
            )}

            {showCreateModal && (
                <CreateModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateTask}
                />
            )}
        </div>
    );
};
