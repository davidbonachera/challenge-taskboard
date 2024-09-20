import { NextRequest, NextResponse } from 'next/server';
import { CardRepository } from '@/app/repositories/card-repository';
import { CardStatus } from '@/app/models/card';
import { ConflictError } from '@/app/errors/conflict-error';

export async function POST(req: NextRequest) {
    const cardRepository = new CardRepository();

    try {
        const body = await req.json();
        const { cardId, newStatus, updated_at } = body;

        if (!cardId || !newStatus || !updated_at) {
            return NextResponse.json({ error: 'cardId, newStatus, and updated_at are required' }, { status: 400 });
        }

        if (!Object.values(CardStatus).includes(newStatus)) {
            return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
        }

        const updatedCard = await cardRepository.moveCard(cardId, newStatus, updated_at);

        return NextResponse.json(updatedCard, { status: 200 });
    } catch (error: any) {
        if (error instanceof ConflictError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
