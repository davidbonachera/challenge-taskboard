import { NextRequest, NextResponse } from 'next/server';
import { ICard } from '@/app/models/card';
import { CardRepository } from '@/app/repositories/card-repository';

export async function GET(req: NextRequest) {
    const cardRepository = new CardRepository();
    const url = new URL(req.url);
    const boardId = url.searchParams.get('boardId');

    if (!boardId) {
        return NextResponse.json({ error: 'Board id is required' }, { status: 400 });
    }

    try {
        const cards: ICard[] = await cardRepository.getCards(boardId);
        return NextResponse.json(cards, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const cardRepository = new CardRepository();

    try {
        const body = await req.json();
        const { title, description, status, board_id } = body;

        if (!title || !status || !board_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (status === 'DOING') {
            const currentCards = await cardRepository.getCards(board_id);
            const doingCards = currentCards.filter((card) => card.status === 'DOING');
            if (doingCards.length >= 2) {
                return NextResponse.json({ error: 'Cannot have more than 2 cards in DOING status' }, { status: 400 });
            }
        }

        const newCard = await cardRepository.createCard({
            title,
            description,
            status,
            board_id,
        });

        return NextResponse.json(newCard, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const cardRepository = new CardRepository();
    const { id } = params;

    try {
        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        if (status === 'DOING') {
            const card = await cardRepository.getCardById(id);
            if (!card) {
                return NextResponse.json({ error: 'Card not found' }, { status: 404 });
            }

            const currentCards = await cardRepository.getCards(card.board_id);
            const doingCards = currentCards.filter((c) => c.status === 'DOING');
            if (doingCards.length >= 2) {
                return NextResponse.json({ error: 'Cannot move more than 2 cards to DOING status' }, { status: 400 });
            }
        }

        const updatedCard = await cardRepository.updateCard(id, { status });
        return NextResponse.json(updatedCard, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
