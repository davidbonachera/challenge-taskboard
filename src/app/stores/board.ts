import { create } from 'zustand';
import { ICard, CardStatus } from '@/app/models/card';
import { CardService } from '@/app/services/card-service';
import { toast } from 'react-toastify';

interface BoardState {
    cards: ICard[];
    setCards: (cards: ICard[]) => void;
    fetchCards: (boardId: string) => Promise<void>;
    deleteCard: (boardId: string) => Promise<void>;
    moveCard: (cardId: string, newStatus: CardStatus) => Promise<void>;
    createCard: (data: Omit<ICard, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    loading: boolean;
    error: string | null;
    saveBoardToLocalStorage: () => void;
    loadBoardFromLocalStorage: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
    cards: [],
    loading: false,
    error: null,

    setCards: (cards: ICard[]) => {
        set({ cards });
        get().saveBoardToLocalStorage();
    },

    /**
     * Fetches cards from the server based on boardId.
     * @param boardId - The ID of the board to fetch cards for.
     */
    fetchCards: async (boardId: string) => {
        set({ loading: true, error: null });
        const cardService = new CardService();

        try {
            const cards = await cardService.getCards(boardId);
            set({ cards });
            get().saveBoardToLocalStorage();
        } catch (error: any) {
            console.error(`${error.message}`);
            set({ error: error.message });
            toast.error(`${error.message}`);
        } finally {
            set({ loading: false });
        }
    },

    /**
     * Moves a card to a new status.
     * Check the timestamp for devices.
     * @param cardId - The ID of the card to move.
     * @param newStatus - The new status to assign to the card.
     */
    moveCard: async (cardId: string, newStatus: CardStatus) => {
        set({ loading: true, error: null });
        const cardService = new CardService();
        const currentCards = get().cards;

        try {
            const localCard = currentCards.find((card) => card.id === cardId);
            if (!localCard) {
                throw new Error('Local card not found');
            }

            const latestCard = await cardService.getCardById(cardId);
            if (!latestCard) {
                throw new Error('Card not found on server');
            }

            if (new Date(localCard.updated_at).getTime() !== new Date(latestCard.updated_at).getTime()) {
                throw new Error('The card has been modified by someone else. Please refresh the board.');
            }

            const updatedCard = await cardService.moveCard(cardId, newStatus);
            const boardId = updatedCard.board_id;

            const refreshedCards = await cardService.getCards(boardId);
            set({ cards: refreshedCards });
            get().saveBoardToLocalStorage();
        } catch (error: any) {
            console.error(`Error moving card: ${error.message}`);
            set({ error: error.message });
            toast.error(`${error.message}`);
        } finally {
            set({ loading: false });
        }
    },


    /**
     * Creates a new card.
     * @param data - The data required to create a new card.
     */
    createCard: async (data: Omit<ICard, 'id' | 'created_at' | 'updated_at'>) => {
        set({ loading: true, error: null });
        const cardService = new CardService();

        try {
            await cardService.createCard(data);

            const boardId = data.board_id;
            const updatedCards = await cardService.getCards(boardId);

            set({ cards: updatedCards });
            get().saveBoardToLocalStorage();
        } catch (error: any) {
            console.error(`${error.message}`);
            set({ error: error.message });
            toast.error(`${error.message}`);
        } finally {
            set({ loading: false });
        }
    },

    /**
     * Deletea card.
     * @param cardId - The id
     */
    deleteCard: async (cardId: string) => {
        set({ loading: true, error: null });
        const cardService = new CardService();

        try {
            await cardService.deleteCard(cardId);
            const updatedCards = get().cards.filter(card => card.id !== cardId);
            set({ cards: updatedCards });
            localStorage.setItem('kanbanBoard', JSON.stringify(updatedCards));
        } catch (error: any) {
            set({ error: error.message });
            toast.error(`${error.message}`);
        } finally {
            set({ loading: false });
        }
    },

    /**
     * Save the current board state to localStorage
     */
    saveBoardToLocalStorage: () => {
        const { cards } = get();
        localStorage.setItem('kanbanBoard', JSON.stringify(cards));
    },

    /**
     * Load the board from localStorage, if available.
     */
    loadBoardFromLocalStorage: () => {
        const savedBoard = localStorage.getItem('kanbanBoard');
        if (savedBoard) {
            const parsedCards = JSON.parse(savedBoard);
            set({ cards: parsedCards });
        }
    },
}));
