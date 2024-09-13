import {NextRequest, NextResponse} from 'next/server';
import {CardRepository} from "@/app/repositories/card-repository";

const cardRepository = new CardRepository();

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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