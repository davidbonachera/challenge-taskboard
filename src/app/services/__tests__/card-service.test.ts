import { CardService } from '@/app/services/card-service';
import { CardStatus } from '@/app/models/card';
import {CardRepository} from "@/app/repositories/card-repository";

jest.mock('@/app/repositories/card-repository');

describe('CardService', () => {
    let service: CardService;
    let mockRepository: jest.Mocked<CardRepository>;

    beforeEach(() => {
        mockRepository = new CardRepository() as jest.Mocked<CardRepository>;
        service = new CardService(mockRepository);
    });

    it('should successfully move a card from TODO to DOING', async () => {
        // Simulate a card in TODO status
        mockRepository.getCardById.mockResolvedValueOnce({
            id: '1',
            status: CardStatus.TODO,
            board_id: 'board1',
            title: 'Sample Card',
        } as any);

        // Simulate other cards in the same board, none of them in DOING status
        mockRepository.getCards.mockResolvedValueOnce([
            { id: '2', status: CardStatus.TODO, board_id: 'board1' } as any,
        ]);

        // Simulate the updateCard method returning the updated card
        mockRepository.updateCard.mockResolvedValueOnce({
            id: '1',
            status: CardStatus.DOING,
            board_id: 'board1',
            title: 'Sample Card',
        } as any);

        const updatedCard = await service.moveCard('1', CardStatus.DOING);

        // Assert the card was moved to DOING status
        expect(updatedCard.status).toBe(CardStatus.DOING);
        expect(mockRepository.updateCard).toHaveBeenCalledWith('1', expect.objectContaining({
            status: CardStatus.DOING,
        }));
    });

    it('should successfully move a card from DOING to DONE', async () => {
        // Simulate a card in DOING status
        mockRepository.getCardById.mockResolvedValueOnce({
            id: '1',
            status: CardStatus.DOING,
            board_id: 'board1',
            title: 'Sample Card',
        } as any);

        // Simulate other cards in the same board
        mockRepository.getCards.mockResolvedValueOnce([
            { id: '2', status: CardStatus.TODO, board_id: 'board1' } as any,
        ]);

        // Simulate the updateCard method returning the updated card
        mockRepository.updateCard.mockResolvedValueOnce({
            id: '1',
            status: CardStatus.DONE,
            board_id: 'board1',
            title: 'Sample Card',
        } as any);

        const updatedCard = await service.moveCard('1', CardStatus.DONE);

        // Assert the card was moved to DONE status
        expect(updatedCard.status).toBe(CardStatus.DONE);
        expect(mockRepository.updateCard).toHaveBeenCalledWith('1', expect.objectContaining({
            status: CardStatus.DONE,
        }));
    });

    it('should throw an error if trying to move a card from DONE status', async () => {
        mockRepository.getCardById.mockResolvedValueOnce({ id: '1', status: CardStatus.DONE } as any);

        await expect(service.moveCard('1', CardStatus.TODO)).rejects.toThrow('Cannot move cards from DONE');
    });

    it('should throw an error if trying to move more than 2 cards to DOING status', async () => {
        const doingCards = [{ id: '1', status: CardStatus.DOING }, { id: '2', status: CardStatus.DOING }];
        mockRepository.getCardById.mockResolvedValueOnce({ id: '3', status: CardStatus.TODO, board_id: 'board1' } as any);
        mockRepository.getCards.mockResolvedValueOnce(doingCards as any);

        await expect(service.moveCard('3', CardStatus.DOING)).rejects.toThrow('Cannot have more than 2 cards in DOING');
    });

});
