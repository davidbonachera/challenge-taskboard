export enum CardStatus {
    BACKLOG = 'BACKLOG',
    TODO = 'TODO',
    DOING = 'DOING',
    DONE = 'DONE',
}

export interface ICard {
    id: string;
    title: string;
    description: string;
    status: CardStatus;
    board_id: string;
    created_at: string;
    updated_at: string;
}