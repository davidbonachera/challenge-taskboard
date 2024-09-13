import { CardRepository } from '@/app/repositories/card-repository';
import { createClient } from '@/app/utils/supabase/client';
import { CardStatus } from '@/app/models/card';

jest.mock('@/app/utils/supabase/client');

describe('CardRepository', () => {
    let repository: CardRepository;
    let supabaseMock: any;

    beforeEach(() => {
        // Create the supabase mock
        supabaseMock = {
            from: jest.fn(),
        };

        // Assign to createClient
        (createClient as jest.Mock).mockReturnValue(supabaseMock);

        repository = new CardRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch all cards for a board', async () => {
        const mockCards = [
            { id: '1', title: 'Card 1', status: CardStatus.TODO, board_id: 'board1' },
            { id: '2', title: 'Card 2', status: CardStatus.DOING, board_id: 'board1' },
        ];

        // Mock the method chain: from().select().eq()
        const eqMock = jest.fn().mockResolvedValue({ data: mockCards, error: null });
        const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
        supabaseMock.from.mockReturnValue({ select: selectMock });

        const cards = await repository.getCards('board1');

        expect(cards).toEqual(mockCards);
        expect(supabaseMock.from).toHaveBeenCalledWith('cards');
        expect(selectMock).toHaveBeenCalledWith('*');
        expect(eqMock).toHaveBeenCalledWith('board_id', 'board1');
    });

    it('should return a card by its id', async () => {
        const mockCard = { id: '1', title: 'Card 1', status: CardStatus.TODO, board_id: 'board1' };

        // Mock the method chain: from().select().eq().single()
        const singleMock = jest.fn().mockResolvedValue({ data: mockCard, error: null });
        const eqMock = jest.fn().mockReturnValue({ single: singleMock });
        const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
        supabaseMock.from.mockReturnValue({ select: selectMock });

        const card = await repository.getCardById('1');

        expect(card).toEqual(mockCard);
        expect(supabaseMock.from).toHaveBeenCalledWith('cards');
        expect(selectMock).toHaveBeenCalledWith('*');
        expect(eqMock).toHaveBeenCalledWith('id', '1');
        expect(singleMock).toHaveBeenCalled();
    });

    it('should return null if the card is not found', async () => {
        // Mock the method chain: from().select().eq().single()
        const singleMock = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
        const eqMock = jest.fn().mockReturnValue({ single: singleMock });
        const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
        supabaseMock.from.mockReturnValue({ select: selectMock });

        const card = await repository.getCardById('1');

        expect(card).toBeNull();
        expect(supabaseMock.from).toHaveBeenCalledWith('cards');
        expect(selectMock).toHaveBeenCalledWith('*');
        expect(eqMock).toHaveBeenCalledWith('id', '1');
        expect(singleMock).toHaveBeenCalled();
    });

    it('should create a new card', async () => {
        const mockNewCard = {
            id: '1',
            title: 'New Card',
            description: 'A new task card',
            status: CardStatus.TODO,
            board_id: 'board1',
            created_at: '2024-09-13T00:00:00Z',
            updated_at: '2024-09-13T00:00:00Z',
        };

        // Mock the method chain: from().insert().single()
        const singleMock = jest.fn().mockResolvedValue({ data: mockNewCard, error: null });
        const insertMock = jest.fn().mockReturnValue({ single: singleMock });
        supabaseMock.from.mockReturnValue({ insert: insertMock });

        const newCard = await repository.createCard({
            title: 'New Card',
            description: 'A new task card',
            status: CardStatus.TODO,
            board_id: 'board1',
        });

        expect(newCard).toEqual(mockNewCard);
        expect(supabaseMock.from).toHaveBeenCalledWith('cards');
        expect(insertMock).toHaveBeenCalledWith([{
            title: 'New Card',
            description: 'A new task card',
            status: CardStatus.TODO,
            board_id: 'board1',
        }]);
        expect(singleMock).toHaveBeenCalled();
    });

    it('should delete a card by its id', async () => {
        // Mock the method chain: from().delete().eq()
        const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
        const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
        supabaseMock.from.mockReturnValue({ delete: deleteMock });

        await repository.deleteCard('1');

        expect(supabaseMock.from).toHaveBeenCalledWith('cards');
        expect(deleteMock).toHaveBeenCalled();
        expect(eqMock).toHaveBeenCalledWith('id', '1');
    });

    it('should throw an error if fetch cards fails', async () => {
        // Mock the method chain: from().select().eq()
        const eqMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'Fetch error' } });
        const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
        supabaseMock.from.mockReturnValue({ select: selectMock });

        await expect(repository.getCards('board1')).rejects.toThrow('Failed to fetch cards');
    });

});
