import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = await requireAuth(req);
    if (token instanceof NextResponse) {
        return token;
    }

    const { id: userId } = token as { id: string };

    // Get the month from query params, default to current month
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const clientToday = searchParams.get("today");

    // Parse month to get date boundaries
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr); // 1-based

    // Calculate today's date string (YYYY-MM-DD)
    const todayStr = clientToday || new Date().toISOString().slice(0, 10);
    const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);

    // Calculate remaining days in the month (including today)
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const today = todayDay;

    // Only calculate remaining days if the active month is the current month
    const isCurrentMonth = todayYear === year && todayMonth === monthNum;
    const remainingDays = isCurrentMonth
        ? Math.max(daysInMonth - today + 1, 1) // +1 because we include today, min 1
        : 1; // For past/future months, just show total remaining as-is

    try {
        // Fetch today's expenses grouped by category (only for current month)
        const todayExpensesResult = await execute(
            `SELECT 
                t.categoryId,
                c.name as categoryName,
                c.color as categoryColor,
                SUM(t.amount) as totalAmount
             FROM Transactions t
             LEFT JOIN Category c ON t.categoryId = c.id
             WHERE t.userId = ?
               AND t.type = 'expense'
               AND date(t.date) = ?
             GROUP BY t.categoryId`,
            [userId, todayStr]
        );

        // Fetch budgets for the selected month with category info
        const budgetsResult = await execute(
            `SELECT 
                b.id,
                b.categoryId,
                b.amount,
                b.spent,
                b.month,
                c.name as categoryName,
                c.color as categoryColor
             FROM Budget b
             LEFT JOIN Category c ON b.categoryId = c.id
             WHERE b.userId = ? AND b.month = ?`,
            [userId, month]
        );

        // Build today's expenses map
        const todayExpenseMap = new Map<string, number>();
        let todayTotal = 0;
        const todayByCategory: Array<{
            categoryId: string;
            categoryName: string;
            categoryColor: string;
            todaySpent: number;
        }> = [];

        for (const row of todayExpensesResult.rows as any[]) {
            const amount = Number(row.totalAmount) || 0;
            todayExpenseMap.set(row.categoryId, amount);
            todayTotal += amount;
            todayByCategory.push({
                categoryId: row.categoryId,
                categoryName: row.categoryName || "Unknown",
                categoryColor: row.categoryColor || "#6B7280",
                todaySpent: amount,
            });
        }

        // Build pacing data for each budgeted category
        const pacing = (budgetsResult.rows as any[]).map((budget) => {
            const budgetAmount = Number(budget.amount) || 0;
            const totalSpent = Number(budget.spent) || 0;
            const todaySpent = todayExpenseMap.get(budget.categoryId) || 0;

            const remainingBudget = Math.max(budgetAmount - totalSpent, 0);
            const remainingBudgetBeforeToday = Math.max(budgetAmount - (totalSpent - todaySpent), 0);
            const dailyLimit = remainingBudgetBeforeToday / remainingDays;

            return {
                categoryId: budget.categoryId,
                categoryName: budget.categoryName || "Unknown",
                categoryColor: budget.categoryColor || "#6B7280",
                budgetAmount,
                totalSpent,
                remainingBudget,
                remainingBudgetBeforeToday,
                remainingDays,
                dailyLimit,
                todaySpent,
                isOverDailyLimit: todaySpent > dailyLimit,
                isOverBudget: totalSpent > budgetAmount,
            };
        });

        return NextResponse.json({
            todayExpenses: {
                total: todayTotal,
                byCategory: todayByCategory,
            },
            pacing,
            meta: {
                today: todayStr,
                daysInMonth,
                remainingDays,
                isCurrentMonth,
            },
        }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching daily summary:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
