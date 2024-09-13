import { Board } from "@/app/components/board";
import { ICard } from "@/app/models/card";
import {Footer} from "@/app/components/footer";

export default async function Home() {
    const boardId = "1";

    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/cards?boardId=${boardId}`, {
        cache: "no-store",
    });

    if (!res.ok) {
        return <p>Failed to load cards</p>;
    }

    const cards: ICard[] = await res.json();

    return (
        <div className="h-screen p-4">
            <h1 className="text-2xl font-bold mb-4">Task Board</h1>
            <Board initialCards={cards}/>
            <Footer/>
        </div>
);
}
