import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/turso";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
    const token = await requireAuth(req);
    if (token instanceof NextResponse) {
        return token;
    }

    const { id: userId } = token as { id: string };

    try {
        const body = await req.json();
        const { id, isEnabled } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Budget Id is required" },
                { status: 400 }
            );
        }

        // isEnabled will be true or false. In SQLite, we store it as 1 or 0.
        const intValue = isEnabled ? 1 : 0;

        await execute(
            "UPDATE Budget SET isDailyLimitEnabled = ? WHERE id = ? AND userId = ?",
            [intValue, id, userId]
        );

        return NextResponse.json(
            { message: "Daily limit preference updated successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error updating budget daily limit:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
