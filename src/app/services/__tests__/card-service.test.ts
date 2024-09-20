import {CardStatus, ICard} from '@/app/models/card';

describe('CardService', () => {
    let CardService: typeof import('@/app/services/card-service').CardService;
    let service: InstanceType<typeof CardService>;

    beforeEach(() => {
        jest.resetModules();
        process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        CardService = require('@/app/services/card-service').CardService;
        service = new CardService();
        global.fetch = jest.fn();
    });

    const mockFetch = (response: any, ok = true, status = 200) => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok,
            status,
            json: async () => response,
        } as Response);
    };

    describe('moveCard', () => {
        it('should successfully move a card from TODO to DOING', async () => {
            const mockCurrentCard: ICard = {
                id: '1',
                status: CardStatus.TODO,
                board_id: 'board1',
                title: 'Sample Card',
                description: 'Sample Description',
                created_at: '2024-09-13T00:00:00Z',
                updated_at: '2024-09-13T00:00:00Z',
            };

            const mockUpdatedCard: ICard = {
                ...mockCurrentCard,
                status: CardStatus.DOING,
                updated_at: '2024-09-14T00:00:00Z',
            };

            // Mock getCardById (GET request)
            mockFetch(mockCurrentCard);

            // Mock moveCard (POST request)
            mockFetch(mockUpdatedCard);

            const updatedCard = await service.moveCard('1', CardStatus.DOING);

            expect(updatedCard.status).toBe(CardStatus.DOING);
            expect(updatedCard.updated_at).toBe('2024-09-14T00:00:00Z');
            expect(global.fetch).toHaveBeenNthCalledWith(
                1,
                `http://localhost:3000/api/v1/cards/1`,
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );

            expect(global.fetch).toHaveBeenNthCalledWith(
                2,
                `http://localhost:3000/api/v1/cards/move`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cardId: '1',
                        newStatus: CardStatus.DOING,
                        updated_at: '2024-09-13T00:00:00Z'
                    }),
                })
            );
        });

        it('should throw a 409 Conflict error when updated_at mismatch occurs', async () => {
            const mockCurrentCard: ICard = {
                id: '1',
                status: CardStatus.TODO,
                board_id: 'board1',
                title: 'Sample Card',
                description: 'Sample Description',
                created_at: '2024-09-13T00:00:00Z',
                updated_at: '2024-09-13T00:00:00Z',
            };

            const mockConflictError = {
                error: 'Conflict detected. The card has been modified by another user.',
            };

            // Mock getCardById (GET request)
            mockFetch(mockCurrentCard);

            // Mock moveCard (POST request) with conflict
            mockFetch(mockConflictError, false, 409);

            await expect(service.moveCard('1', CardStatus.DOING)).rejects.toThrow('Conflict detected. The card has been modified by another user.');

            expect(global.fetch).toHaveBeenNthCalledWith(
                1,
                `http://localhost:3000/api/v1/cards/1`,
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );

            expect(global.fetch).toHaveBeenNthCalledWith(
                2,
                `http://localhost:3000/api/v1/cards/move`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cardId: '1',
                        newStatus: CardStatus.DOING,
                        updated_at: '2024-09-13T00:00:00Z'
                    }),
                })
            );
        });

        it('should handle concurrent move operations correctly', async () => {
            const mockCurrentCard: ICard = {
                id: '2',
                status: CardStatus.TODO,
                board_id: 'board1',
                title: 'Another Card',
                description: 'Another Description',
                created_at: '2024-09-13T00:00:00Z',
                updated_at: '2024-09-13T00:00:00Z',
            };

            const mockUpdatedCard: ICard = {
                ...mockCurrentCard,
                status: CardStatus.DOING,
                updated_at: '2024-09-14T00:00:00Z',
            };

            const mockConflictError = {
                error: 'Conflict detected. The card has been modified by another user.',
            };

            mockFetch(mockCurrentCard);
            mockFetch(mockCurrentCard);
            mockFetch(mockUpdatedCard);
            mockFetch(mockConflictError, false, 409);

            // Initiate both move operations
            const movePromise1 = service.moveCard('2', CardStatus.DOING);
            const movePromise2 = service.moveCard('2', CardStatus.DONE);

            const [result1, result2] = await Promise.allSettled([movePromise1, movePromise2]);

            // Assertions for first moveCard
            expect(result1.status).toBe('fulfilled');
            if (result1.status === 'fulfilled') {
                expect(result1.value.status).toBe(CardStatus.DOING);
                expect(result1.value.updated_at).toBe('2024-09-14T00:00:00Z');
            }

            // Assertions for second moveCard
            expect(result2.status).toBe('rejected');
            if (result2.status === 'rejected') {
                expect(result2.reason.message).toBe('Conflict detected. The card has been modified by another user.');
            }

            // Verify fetch calls
            expect(global.fetch).toHaveBeenNthCalledWith(
                1,
                `http://localhost:3000/api/v1/cards/2`,
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );

            expect(global.fetch).toHaveBeenNthCalledWith(
                2,
                `http://localhost:3000/api/v1/cards/2`,
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );

            expect(global.fetch).toHaveBeenNthCalledWith(
                3,
                `http://localhost:3000/api/v1/cards/move`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cardId: '2',
                        newStatus: CardStatus.DOING,
                        updated_at: '2024-09-13T00:00:00Z'
                    }),
                })
            );

            expect(global.fetch).toHaveBeenNthCalledWith(
                4,
                `http://localhost:3000/api/v1/cards/move`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cardId: '2',
                        newStatus: CardStatus.DONE,
                        updated_at: '2024-09-13T00:00:00Z'
                    }),
                })
            );
        });

    });

    describe('getCards', () => {

        it('should fetch all cards for a specific board', async () => {
            const mockCards: ICard[] = [
                {
                    id: '1',
                    status: CardStatus.TODO,
                    board_id: 'board1',
                    title: 'Card 1',
                    description: 'Desc 1',
                    created_at: '2024-09-13T00:00:00Z',
                    updated_at: '2024-09-13T00:00:00Z',
                },
                {
                    id: '2',
                    status: CardStatus.DOING,
                    board_id: 'board1',
                    title: 'Card 2',
                    description: 'Desc 2',
                    created_at: '2024-09-13T00:00:00Z',
                    updated_at: '2024-09-13T00:00:00Z',
                },
            ];

            mockFetch(mockCards);

            const cards = await service.getCards('board1');

            expect(cards).toEqual(mockCards);
            expect(global.fetch).toHaveBeenCalledWith(
                `http://localhost:3000/api/v1/cards?boardId=board1`,
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );
        });
    });

    describe('getCardById', () => {

        it('should fetch a card by its ID', async () => {
            const mockCard: ICard = {
                id: '1',
                status: CardStatus.TODO,
                board_id: 'board1',
                title: 'Sample Card',
                description: 'Sample Description',
                created_at: '2024-09-13T00:00:00Z',
                updated_at: '2024-09-14T00:00:00Z',
            };

            mockFetch(mockCard);

            const card = await service.getCardById('1');

            expect(card).toEqual(mockCard);
            expect(global.fetch).toHaveBeenCalledWith(
                `http://localhost:3000/api/v1/cards/1`,
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );
        });

        it('should return null if the card is not found', async () => {
            mockFetch({}, false, 404);

            const card = await service.getCardById('999');

            expect(card).toBeNull();
            expect(global.fetch).toHaveBeenCalledWith(
                `http://localhost:3000/api/v1/cards/999`,
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );
        });
    });

    describe('createCard', () => {

        it('should create a new card', async () => {
            const newCardData = {
                title: 'New Card',
                description: 'A new task card',
                status: CardStatus.TODO,
                board_id: 'board1',
            };

            const mockCreatedCard: ICard = {
                id: '3',
                ...newCardData,
                created_at: '2024-09-14T00:00:00Z',
                updated_at: '2024-09-14T00:00:00Z',
            };

            mockFetch(mockCreatedCard);

            const createdCard = await service.createCard(newCardData);

            expect(createdCard).toEqual(mockCreatedCard);
            expect(global.fetch).toHaveBeenCalledWith(
                `http://localhost:3000/api/v1/cards`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newCardData),
                })
            );
        });

        it('should throw an error when creating a card fails', async () => {
            const newCardData = {
                title: 'New Card',
                description: 'A new task card',
                status: CardStatus.DOING,
                board_id: 'board1',
            };

            const mockErrorResponse = {
                error: 'Cannot have more than 2 cards in DOING status',
            };

            mockFetch(mockErrorResponse, false, 400);

            await expect(service.createCard(newCardData)).rejects.toThrow('Cannot have more than 2 cards in DOING status');
            expect(global.fetch).toHaveBeenCalledWith(
                `http://localhost:3000/api/v1/cards`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newCardData),
                })
            );
        });
    });

    describe('deleteCard', () => {

        it('should delete a card successfully', async () => {
            mockFetch({}, true, 200);

            await expect(service.deleteCard('1')).resolves.toBeUndefined();
            expect(global.fetch).toHaveBeenCalledWith(
                `http://localhost:3000/api/v1/cards/1`,
                expect.objectContaining({
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );
        });

        it('should throw an error when deleting a card fails', async () => {
            mockFetch({error: 'Failed to delete card'}, false, 500);

            await expect(service.deleteCard('1')).rejects.toThrow('Failed to delete card');
            expect(global.fetch).toHaveBeenCalledWith(
                `http://localhost:3000/api/v1/cards/1`,
                expect.objectContaining({
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );
        });
    });
});