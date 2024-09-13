import { ICard } from './card';

export interface Board {
    id: string;
    cards: ICard[];
    created_at: string;
    lastSync_at: string;
}