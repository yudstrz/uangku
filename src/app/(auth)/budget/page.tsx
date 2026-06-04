"use client";

import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Budget, Category, formatCurrency } from '@/types';
import { PlusIcon, ExclamationCircleIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import BudgetForm from './BudgetForm';
import { Select } from '@/components/form';
import { showToast } from 'nextjs-toast-notify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Types for the daily summary API response
interface DailyExpenseByCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  todaySpent: number;
}

interface PacingData {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgetAmount: number;
  totalSpent: number;
  remainingBudget: number;
  remainingDays: number;
  dailyLimit: number;
  todaySpent: number;
  isOverDailyLimit: boolean;
  isOverBudget: boolean;
}

interface DailySummaryData {
  todayExpenses: {
    total: number;
    byCategory: DailyExpenseByCategory[];
  };
  pacing: PacingData[];
  meta: {
    today: string;
    daysInMonth: number;
    remainingDays: number;
    isCurrentMonth: boolean;
  };
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [activeMonth, setActiveMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<DailySummaryData | null>(null);
  const [isDailySummaryLoading, setIsDailySummaryLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.error) {
          showToast.error(`Error fetching categories`, {
            duration: 3000,
            progress: true,
            position: "top-right",
            transition: "bounceIn",
            icon: '',
            sound: true,
          });
          console.error('Error fetching categories:', categoriesData.error);
        } else {
          setCategories(categoriesData);
        }

        // Fetch budgets
        const budgetsResponse = await fetch('/api/budget', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const budgetsData = await budgetsResponse.json();
        if (budgetsData.error) {
          showToast.error(`Error fetching budgets`, {
            duration: 3000,
            progress: true,
            position: "top-right",
            transition: "bounceIn",
            icon: '',
            sound: true,
          });
          console.error('Error fetching budgets:', budgetsData.error);
        } else {
          setBudgets(budgetsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch daily summary data when activeMonth changes
  const fetchDailySummary = useCallback(async () => {
    try {
      setIsDailySummaryLoading(true);
      const response = await fetch(`/api/budget/daily-summary?month=${activeMonth}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.error) {
        console.error('Error fetching daily summary:', data.error);
      } else {
        setDailySummary(data);
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
    } finally {
      setIsDailySummaryLoading(false);
    }
  }, [activeMonth]);

  useEffect(() => {
    fetchDailySummary();
  }, [fetchDailySummary]);

  // Helper to get pacing data for a specific category
  const getPacingForCategory = (categoryId: string): PacingData | undefined => {
    return dailySummary?.pacing.find(p => p.categoryId === categoryId);
  };

  // Format today's date for display
  const formatTodayDate = () => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Filter budgets by active month
  const filteredBudgets = budgets.filter(budget => budget.month === activeMonth);

  // Calculate total budget and spent amount
  const totalBudget = filteredBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = filteredBudgets.reduce((sum, budget) => sum + budget.spent, 0);

  // Get all months from the budgets data
  const getUniqueMonths = () => {
    const months = budgets.map(budget => budget.month);
    return [...new Set(months)];
  };

  // Format month for display (YYYY-MM to Month YYYY)
  const formatMonth = (monthStr: string, func: string) => {
    console.log(monthStr, func);
    const [year, month] = monthStr?.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Handle new budget
  const handleAddBudget = (budget: any) => {
    if (editingBudget) {
      fetch('/api/budget/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(budget)
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            showToast.error(data.error, {
              duration: 3000,
              progress: true,
              position: "top-right",
              transition: "bounceIn",
              icon: '',
              sound: true,
            })
            return
          }
          const updatedBudgets = budgets.map(b =>
            b.id === editingBudget.id ? { ...budget, id: editingBudget.id } : b
          );
          setBudgets(updatedBudgets);
          showToast.success(data.message, {
            duration: 3000,
            progress: true,
            position: "top-right",
            transition: "bounceIn",
            icon: '',
            sound: true,
          });
          setIsFormOpen(false);
          setEditingBudget(null);
        })
        .catch(error => {
          console.error('Error updating budget:', error);
          showToast.error('Error updating budget', {
            duration: 3000,
            progress: true,
            position: "top-right",
            transition: "bounceIn",
            icon: '',
            sound: true,
          })
        });
    } else {
      fetch('/api/budget/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(budget)
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            showToast.error(data.error, {
              duration: 3000,
              progress: true,
              position: "top-right",
              transition: "bounceIn",
              icon: '',
              sound: true,
            })
          } else {
            setBudgets([...budgets, data.budget]);
            showToast.success('Budget added successfully', {
              duration: 3000,
              progress: true,
              position: "top-right",
              transition: "bounceIn",
              icon: '',
              sound: true,
            })
            setIsFormOpen(false);
            setEditingBudget(null);
          }
        })
        .catch(error => {
          console.error('Error adding budget:', error);
        });
    }
  };

  // Handle delete budget
  const handleDeleteBudget = (id: string) => {
    fetch('/api/budget/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          showToast.error(data.error, {
            duration: 3000,
            progress: true,
            position: "top-right",
            transition: "bounceIn",
            icon: '',
            sound: true,
          })
        } else {
          showToast.success("Budget deleted successfully", {
            duration: 3000,
            progress: true,
            position: "top-right",
            transition: "bounceIn",
            icon: '',
            sound: true,
          })
          setBudgets(budgets.filter(b => b.id !== id));
        }
      })
      .catch(error => {
        console.error('Error deleting budget:', error);
        showToast.error('Error deleting budget', {
          duration: 3000,
          progress: true,
          position: "top-right",
          transition: "bounceIn",
          icon: '',
          sound: true,
        })
      });
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  // Get category color by ID
  const getCategoryColor = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    return category ? category.color : '#gray';
  };

  // Calculate budget status as percentage
  const getBudgetPercentage = (amount: number, spent: number) => {
    return amount > 0 ? Math.min(Math.round((spent / amount) * 100), 100) : 0;
  };

  // Check if a budget is over the limit
  const isOverBudget = (amount: number, spent: number) => {
    return spent > amount;
  };

  // Skeleton components
  const SummarySkeleton = () => (
    <Card>
      <div className="flex flex-col">
        <Skeleton height={24} width={150} />
        <Skeleton height={32} className="mt-2" />
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <Skeleton height={16} width={100} />
            <Skeleton height={16} width={80} />
          </div>
          <Skeleton height={10} />
        </div>
      </div>
    </Card>
  );

  const BudgetCardSkeleton = () => (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <Skeleton circle height={32} width={32} className="mr-3" />
          <div>
            <Skeleton height={20} width={120} />
            <Skeleton height={16} width={80} className="mt-1" />
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton height={32} width={60} />
          <Skeleton height={32} width={70} />
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <Skeleton height={16} width={100} />
          <Skeleton height={16} width={100} />
        </div>
        <Skeleton height={10} className="mb-2" />
        <div className="flex justify-between">
          <Skeleton height={16} width={120} />
          <Skeleton height={16} width={60} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Budget Planning</h1>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Month selector */}
          <div className="flex items-center h-10 w-full sm:w-auto">
            {isLoading ? (
              <Skeleton height={40} width={208} />
            ) : (
              <Select
                id="month-selector"
                name="month"
                value={activeMonth}
                onChange={(value) => setActiveMonth(value)}
                options={getUniqueMonths().map((month) => ({
                  value: month,
                  label: formatMonth(month, "getUniqueMonths")
                }))}
                className="mb-0 w-52"
                fullWidth={false}
              />
            )}
          </div>

          {isLoading ? (
            <Skeleton height={40} width={140} />
          ) : (
            <Button
              onClick={() => {
                setEditingBudget(null);
                setIsFormOpen(true);
              }}
              className="flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Budget
            </Button>
          )}
        </div>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <SummarySkeleton />
            <SummarySkeleton />
          </>
        ) : (
          <>
            <Card>
              <div className="flex flex-col">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Budget</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(totalBudget)}
                </p>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <span>Spent: {formatCurrency(totalSpent)}</span>
                    <span>
                      {getBudgetPercentage(totalBudget, totalSpent)}% of budget
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${isOverBudget(totalBudget, totalSpent)
                        ? 'bg-red-600 dark:bg-red-500'
                        : getBudgetPercentage(totalBudget, totalSpent) > 80
                          ? 'bg-yellow-400 dark:bg-yellow-500'
                          : 'bg-green-600 dark:bg-green-500'
                        }`}
                      style={{ width: `${getBudgetPercentage(totalBudget, totalSpent)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex flex-col">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Remaining Budget</h3>
                <p className={`text-3xl font-bold mt-2 ${totalBudget - totalSpent > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
                  }`}>
                  {formatCurrency(totalBudget - totalSpent)}
                </p>

                <div className="mt-4 flex items-center">
                  {isOverBudget(totalBudget, totalSpent) ? (
                    <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md flex items-center text-red-800 dark:text-red-300 w-full">
                      <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                      <span>You have exceeded your total budget for {formatMonth(activeMonth, "activeMonth")}</span>
                    </div>
                  ) : (
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-md flex items-center text-green-800 dark:text-green-300 w-full">
                      <span>You are on track with your budget for {formatMonth(activeMonth, "activeMonthh")}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* ===== Ringkasan Harian (Today's Expenses) ===== */}
      <div className="mt-8">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <CalendarDaysIcon className="h-6 w-6 mr-2 text-blue-500" />
          Pengeluaran Hari Ini
        </h2>

        {isDailySummaryLoading ? (
          <Card>
            <Skeleton height={28} width={200} className="mb-4" />
            <Skeleton height={40} width={250} className="mb-6" />
            <div className="space-y-3">
              <Skeleton height={44} />
              <Skeleton height={44} />
              <Skeleton height={44} />
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatTodayDate()}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(dailySummary?.todayExpenses.total || 0)}
                </p>
              </div>
              {dailySummary?.meta.isCurrentMonth && (
                <div className="mt-3 sm:mt-0 flex items-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                  <ClockIcon className="h-4 w-4 mr-1.5" />
                  <span>{dailySummary.meta.remainingDays} hari tersisa bulan ini</span>
                </div>
              )}
            </div>

            {dailySummary && dailySummary.todayExpenses.byCategory.length > 0 ? (
              <div className="space-y-3">
                {dailySummary.todayExpenses.byCategory
                  .sort((a, b) => b.todaySpent - a.todaySpent)
                  .map((item) => (
                    <div
                      key={item.categoryId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                          style={{ backgroundColor: item.categoryColor }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.categoryName}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.todaySpent)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarDaysIcon className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Belum ada pengeluaran hari ini 🎉
                </p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Category Budgets */}
      <h2 className="text-xl font-medium text-gray-900 dark:text-white mt-8">Category Budgets</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
        </div>
      ) : filteredBudgets.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBudgets.map((budget) => (
            <Card key={budget.id}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div
                    className="w-8 h-8 rounded-full mr-3"
                    style={{ backgroundColor: getCategoryColor(budget.categoryId) }}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {getCategoryName(budget.categoryId)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatMonth(budget.month, "formatMonth")}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingBudget(budget);
                      setIsFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteBudget(budget.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">
                    Spent: {formatCurrency(budget.spent)}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    Budget: {formatCurrency(budget.amount)}
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                  <div
                    className={`h-2.5 rounded-full ${isOverBudget(budget.amount, budget.spent)
                      ? 'bg-red-600 dark:bg-red-500'
                      : getBudgetPercentage(budget.amount, budget.spent) > 80
                        ? 'bg-yellow-400 dark:bg-yellow-500'
                        : 'bg-green-600 dark:bg-green-500'
                      }`}
                    style={{ width: `${getBudgetPercentage(budget.amount, budget.spent)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${isOverBudget(budget.amount, budget.spent)
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                    }`}>
                    {isOverBudget(budget.amount, budget.spent)
                      ? `${formatCurrency(budget.spent - budget.amount)} over budget`
                      : `${formatCurrency(budget.amount - budget.spent)} remaining`}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {getBudgetPercentage(budget.amount, budget.spent)}% used
                  </span>
                </div>

                {isOverBudget(budget.amount, budget.spent) && (
                  <div className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    You have exceeded this budget
                  </div>
                )}

                {/* ===== Budget Pacing / Batas Harian ===== */}
                {(() => {
                  const pacing = getPacingForCategory(budget.categoryId);
                  if (!pacing || !dailySummary?.meta.isCurrentMonth) return null;

                  const isOverLimit = pacing.isOverDailyLimit;
                  const isNearLimit = pacing.todaySpent > pacing.dailyLimit * 0.8;
                  const budgetExhausted = pacing.remainingBudget <= 0;

                  return (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Batas Harian
                        </span>
                        {budgetExhausted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Budget Habis
                          </span>
                        ) : isOverLimit ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Melebihi Batas
                          </span>
                        ) : isNearLimit ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            Hampir Batas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Aman
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between">
                        <p className={`text-lg font-bold ${
                          budgetExhausted
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {budgetExhausted
                            ? formatCurrency(0)
                            : formatCurrency(pacing.dailyLimit)}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          per hari
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {budgetExhausted
                          ? 'Budget bulan ini sudah habis terpakai'
                          : `Sisa ${formatCurrency(pacing.remainingBudget)} ÷ ${pacing.remainingDays} hari`}
                      </p>

                      {!budgetExhausted && pacing.todaySpent > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500 dark:text-gray-400">Hari ini</span>
                            <span className={`font-medium ${
                              isOverLimit
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {formatCurrency(pacing.todaySpent)} / {formatCurrency(pacing.dailyLimit)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isOverLimit
                                  ? 'bg-red-500'
                                  : isNearLimit
                                    ? 'bg-yellow-400'
                                    : 'bg-blue-500'
                              }`}
                              style={{
                                width: `${Math.min((pacing.todaySpent / pacing.dailyLimit) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <div className="text-center">
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No budgets set for {formatMonth(activeMonth, "no budgets")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start planning your finances by setting up category budgets.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => {
                  setEditingBudget(null);
                  setIsFormOpen(true);
                }}
              >
                <PlusIcon className="h-5 w-5 mr-2 -ml-1" />
                Add Budget
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Budget Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingBudget ? 'Edit Budget' : 'Add New Budget'}
              </h2>
              <BudgetForm
                onSubmit={handleAddBudget}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingBudget(null);
                }}
                categories={categories}
                initialData={editingBudget}
                defaultMonth={activeMonth}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}