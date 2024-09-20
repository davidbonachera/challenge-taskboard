import {NextRequest, NextResponse} from 'next/server';
import {CardRepository} from "@/app/repositories/card-repository";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    const cardRepository = new CardRepository();

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const card = await cardRepository.getCardById(id);
        if (!card) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }
        return NextResponse.json(card, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch card' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const cardRepository = new CardRepository();
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        await cardRepository.deleteCard(id);
        return NextResponse.json({ message: 'Card deleted successfully' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to delete card' }, { status: 500 });
    }
}