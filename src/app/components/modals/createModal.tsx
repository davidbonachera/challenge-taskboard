"use client";

import React, {useState} from "react";

interface NewTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string) => void;
}

export const CreateModal: React.FC<NewTaskModalProps> = ({
                                                              isOpen,
                                                              onClose,
                                                              onSubmit,
                                                          }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = () => {
        if (title.trim() === "" || description.trim() === "") {
            alert("Please provide both title and description.");
            return;
        }
        onSubmit(title, description);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded shadow-lg p-6 w-96">
                <h2 className="text-xl font-bold mb-4">Create New Task</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                        rows={3}
                    ></textarea>
                </div>
                <div className="flex justify-end">
                    <button
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded mr-2"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={handleSubmit}
                    >
                        Create Task
                    </button>
                </div>
            </div>
        </div>
    );
};
