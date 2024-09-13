import { ICard } from './card';

export interface Database {
    public: {
        Tables: {
            cards: {
                Row: ICard;
                Insert: Omit<ICard, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<ICard>;
            };
        };
    };
}
