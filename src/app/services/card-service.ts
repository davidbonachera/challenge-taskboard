import { ICard, CardStatus } from '@/app/models/card';
import { CardRepository, ICardRepository } from "@/app/repositories/card-repository";

export class CardService {
    private baseUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/cards`;
    private repository: ICardRepository;

    constructor(repository: ICardRepository = new CardRepository()) {
        this.repository = repository;
    }

    /**
     * Fetches all cards for a specific board.
     * @param boardId - The ID of the board.
     * @returns Promise<ICard[]> - List of cards.
     */
    async getCards(boardId: string): Promise<ICard[]> {
        const response = await fetch(`${this.baseUrl}?boardId=${boardId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch cards');
        }

        return response.json();
    }



    /**
     * Moves a card to a new status, enforcing business rules.
     * The only one directly calling Supabase SDK for convenience
     * @param cardId - The ID of the card to move.
     * @param newStatus - The new status to assign to the card.
     * @returns The updated card.
     * @throws Error if business rules are violated.
     */
    async moveCard(cardId: string, newStatus: CardStatus): Promise<ICard> {
        const card = await this.repository.getCardById(cardId);
        if (!card) {
            throw new Error('Card not found');
        }

        if (card.status === CardStatus.DONE) {
            throw new Error('Cannot move cards from DONE');
        }

        if (newStatus === CardStatus.DOING) {
            const cardsCount = (await this.repository.getCards(card.board_id)).filter(
                (c) => c.status === CardStatus.DOING
            );
            if (cardsCount.length >= 2) {
                throw new Error('Cannot have more than 2 cards in DOING');
            }
        }

        const updates: Partial<ICard> = {
            ...card,
            status: newStatus,
            updated_at: new Date().toISOString(),
        };

        return this.repository.updateCard(cardId, updates);
    }

    /**
     * Fetches a card by its ID.
     * @param cardId - The ID of the card.
     * @returns Promise<ICard | null> - The card object or null if not found.
     */
    async getCardById(cardId: string): Promise<ICard | null> {
        return this.repository.getCardById(cardId);
    }

    /**
     * Creates a new card by calling the API.
     * @param data - The data required to create a new card.
     * @returns Promise<ICard> - The newly created card.
     */
    async createCard(data: Omit<ICard, 'id' | 'created_at' | 'updated_at'>): Promise<ICard> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Cannot have more than 2 cards in DOING status');
        }

        return response.json();
    }

    /**
     * Deletes a card by calling the API.
     * @param cardId - The ID of the card to delete.
     * @returns Promise<void>
     */
    async deleteCard(cardId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${cardId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete card');
        }

        return;
    }
}
