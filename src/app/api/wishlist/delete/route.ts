import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/turso";
import { requireAuth } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
    const token = await requireAuth(req);
    if (token instanceof NextResponse) {
        return token;
    }

    const { id: userId } = token as { id: string };

    try {
        const searchParams = req.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: "Id is required" },
                { status: 400 }
            );
        }

        await execute(
            "DELETE FROM Wishlist WHERE id = ? AND userId = ?",
            [id, userId]
        );

        return NextResponse.json(
            { message: "Wishlist item deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting wishlist item:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
