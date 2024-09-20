import { ICard, CardStatus } from '@/app/models/card';

export class CardService {
    private baseUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/cards`;

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
     * @param cardId - The ID of the card to move.
     * @param newStatus - The new status to assign to the card.
     * @throws Error if business rules are violated.
     */
    async moveCard(cardId: string, newStatus: CardStatus): Promise<ICard> {
        // eslint-disable-next-line react/no-is-mounted
        const currentCard = await this.getCardById(cardId);
        if (!currentCard) {
            throw new Error('Card not found');
        }

        const response = await fetch(`${this.baseUrl}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cardId, newStatus, updated_at: currentCard.updated_at }),
        });

        if (response.status === 409) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Conflict occurred while moving the card');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to move card');
        }

        return response.json();
    }

    /**
     * Fetches a card by its ID.
     * @param cardId - The ID of the card.
     * @returns Promise<ICard | null> - The card object or null if not found.
     */
    async getCardById(cardId: string): Promise<ICard | null> {
        const response = await fetch(`${this.baseUrl}/${cardId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch card');
        }

        return response.json();
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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Cannot have more than 2 cards in DOING status');
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
