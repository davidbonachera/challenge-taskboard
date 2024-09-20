import { CardStatus, ICard } from '@/app/models/card';
import {createClient} from "@/app/utils/supabase/server";
import {ConflictError} from "@/app/errors/conflict-error";

export interface ICardRepository {
    getCards(boardId: string): Promise<ICard[]>;
    getCardById(cardId: string): Promise<ICard | null>;
    createCard(card: Omit<ICard, 'id' | 'created_at' | 'updated_at'>): Promise<ICard>;
    updateCard(cardId: string, updates: Partial<ICard>): Promise<ICard>;
    deleteCard(cardId: string): Promise<void>;
    moveCard(cardId: string, newStatus: CardStatus, clientUpdatedAt: string): Promise<ICard>;
}

export class CardRepository implements ICardRepository {
    private supabase;

    constructor() {
        this.supabase = createClient();
    }

    async getCards(boardId: string): Promise<ICard[]> {
        const { data, error } = await this.supabase
            .from('cards')
            .select('*')
            .eq('board_id', boardId);

        if (error) {
            throw new Error('Failed to fetch cards');
        }

        return data as ICard[];
    }

    async getCardById(cardId: string): Promise<ICard | null> {
        const { data, error } = await this.supabase
            .from('cards')
            .select('*')
            .eq('id', cardId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error('Failed to fetch card');
        }

        return data as ICard;
    }

    async createCard(card: Omit<ICard, 'id' | 'created_at' | 'updated_at'>): Promise<ICard> {
        const { data, error } = await this.supabase
            .from('cards')
            .insert([card])
            .single();

        if (error) {
            throw new Error('Failed to create card');
        }

        return data as ICard;
    }

    async updateCard(cardId: string, updates: Partial<ICard>): Promise<ICard> {
        const { data: existingCard, error: fetchError } = await this.supabase
            .from('cards')
            .select('*')
            .eq('id', cardId)
            .single();

        if (fetchError) {
            throw new Error(`Card with id ${cardId} not found`);
        }

        const { data, error } = await this.supabase
            .from('cards')
            .update({
                title: updates.title || existingCard.title,
                description: updates.description || existingCard.description,
                status: updates.status || existingCard.status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', cardId)
            .select('*')
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            throw new Error(`Failed to update card: ${error.message}`);
        }

        return data as ICard;
    }

    async moveCard(cardId: string, newStatus: CardStatus, clientUpdatedAt: string): Promise<ICard> {
        const { data: existingCard, error: fetchError } = await this.supabase
            .from('cards')
            .select('*')
            .eq('id', cardId)
            .single();

        if (fetchError) {
            throw new Error(`Card with id ${cardId} not found`);
        }

        if (existingCard.status === CardStatus.DONE) {
            throw new Error('Cannot move cards from DONE');
        }

        const statusOrder = [
            CardStatus.BACKLOG,
            CardStatus.TODO,
            CardStatus.DOING,
            CardStatus.DONE,
        ];

        const currentIndex = statusOrder.indexOf(existingCard.status);
        const newIndex = statusOrder.indexOf(newStatus);

        if (Math.abs(currentIndex - newIndex) !== 1) {
            throw new Error('Cards can only be moved one column at a time.');
        }

        if (newStatus === CardStatus.DOING) {
            const { data: doingCards, error: countError } = await this.supabase
                .from('cards')
                .select('*')
                .eq('board_id', existingCard.board_id)
                .eq('status', CardStatus.DOING);

            if (countError) {
                throw new Error('Failed to fetch DOING cards');
            }

            if (doingCards.length >= 2) {
                throw new Error('Cannot have more than 2 cards in DOING status');
            }
        }

        if (existingCard.updated_at !== clientUpdatedAt) {
            throw new ConflictError('Conflict detected. The card has been modified by another user.');
        }

        const updates: Partial<ICard> = {
            status: newStatus,
            updated_at: new Date().toISOString(), // Update to current time
        };

        const { data, error } = await this.supabase
            .from('cards')
            .update(updates)
            .eq('id', cardId)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Failed to update card: ${error.message}`);
        }

        return data as ICard;
    }

    async deleteCard(cardId: string): Promise<void> {
        const { error } = await this.supabase
            .from('cards')
            .delete()
            .eq('id', cardId);

        if (error) {
            throw new Error('Failed to delete card');
        }
    }
}
