"use client";

import { FinancialReportPDF } from "@/components/FinancialReportPDF";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { pdf } from "@react-pdf/renderer";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { BarChart2, CalendarIcon, Download, FileDown, PieChart, TrendingDown, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#4ade80", "#f87171", "#60a5fa", "#fbbf24", "#a78bfa", "#fb7185"];

const DATE_RANGES = [
  { label: "Last 30 Days", value: "30days" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Last 6 Months", value: "6months" },
  { label: "This Year", value: "year" },
  { label: "Custom", value: "custom" }
];

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("3months");
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    netBalance: 0,
    averageExpense: 0,
    averageIncome: 0,
    topExpenseCategory: "",
    topIncomeCategory: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  useEffect(() => {
    if (selectedDateRange !== "custom") {
      const today = new Date();
      let from = new Date();
      
      switch (selectedDateRange) {
        case "30days":
          from = subMonths(today, 1);
          break;
        case "3months":
          from = subMonths(today, 3);
          break;
        case "6months":
          from = subMonths(today, 6);
          break;
        case "year":
          from = new Date(today.getFullYear(), 0, 1);
          break;
      }
      
      setDateRange({
        from: startOfMonth(from),
        to: endOfMonth(today)
      });
    }
  }, [selectedDateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, incomesRes, categoriesRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/income"),
        fetch("/api/categories")
      ]);

      if (!expensesRes.ok || !incomesRes.ok || !categoriesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [expensesData, incomesData, categoriesData] = await Promise.all([
        expensesRes.json(),
        incomesRes.json(),
        categoriesRes.json()
      ]);

      setExpenses(expensesData);
      setIncomes(incomesData);
      setCategories(categoriesData);
      processData(expensesData, incomesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processData = (expensesData, incomesData) => {
    // Filter data based on date range and category
    const filteredExpenses = expensesData.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isInDateRange = expenseDate >= dateRange.from && expenseDate <= dateRange.to;
      const isInCategory = selectedCategory === "all" || expense.category === selectedCategory;
      return isInDateRange && isInCategory;
    });

    const filteredIncomes = incomesData.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate >= dateRange.from && incomeDate <= dateRange.to;
    });

    // Calculate summary statistics
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    const averageExpense = totalExpenses / (filteredExpenses.length || 1);
    const averageIncome = totalIncome / (filteredIncomes.length || 1);

    // Find top categories
    const expenseCategories = {};
    const incomeCategories = {};
    
    filteredExpenses.forEach(expense => {
      expenseCategories[expense.category] = (expenseCategories[expense.category] || 0) + expense.amount;
    });
    
    filteredIncomes.forEach(income => {
      incomeCategories[income.category] = (incomeCategories[income.category] || 0) + income.amount;
    });

    const topExpenseCategory = Object.entries(expenseCategories)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "None";
    
    const topIncomeCategory = Object.entries(incomeCategories)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "None";

    setSummary({
      totalExpenses,
      totalIncome,
      netBalance,
      averageExpense,
      averageIncome,
      topExpenseCategory,
      topIncomeCategory
    });

    // Prepare pie chart data
    const pieChartData = Object.entries(expenseCategories).map(([category, amount]) => ({
      name: category,
      value: amount
    }));

    // Prepare bar chart data (monthly comparison)
    const monthlyData = {};
    const months = new Set();

    [...filteredExpenses, ...filteredIncomes].forEach(item => {
      const month = format(new Date(item.date), "MMM yyyy");
      months.add(month);
      if (!monthlyData[month]) {
        monthlyData[month] = { expenses: 0, income: 0 };
      }
      if ('amount' in item) {
        if (item.type === 'expense') {
          monthlyData[month].expenses += item.amount;
        } else {
          monthlyData[month].income += item.amount;
        }
      }
    });

    const barChartData = Array.from(months)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(month => ({
        month,
        ...monthlyData[month]
      }));

    setPieData(pieChartData);
    setChartData(barChartData);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    processData(expenses, incomes);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    processData(expenses, incomes);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const handleExport = (format) => {
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isInDateRange = expenseDate >= dateRange.from && expenseDate <= dateRange.to;
      const isInCategory = selectedCategory === "all" || expense.category === selectedCategory;
      return isInDateRange && isInCategory;
    });

    const filteredIncomes = incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate >= dateRange.from && incomeDate <= dateRange.to;
    });

    if (format === 'csv') {
      const csvContent = [
        ["Type", "Date", "Category", "Description", "Amount"],
        ...filteredExpenses.map(expense => [
          "Expense",
          format(new Date(expense.date), "yyyy-MM-dd"),
          expense.category,
          expense.description || "",
          expense.amount
        ]),
        ...filteredIncomes.map(income => [
          "Income",
          format(new Date(income.date), "yyyy-MM-dd"),
          income.category,
          income.description || "",
          income.amount
        ])
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `financial-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      handlePdfDownload(filteredExpenses, filteredIncomes);
    }
  };

  const handlePdfDownload = async (filteredExpenses, filteredIncomes) => {
    try {
      setIsGeneratingPdf(true);
      
      if (!filteredExpenses.length && !filteredIncomes.length) {
        toast({
          title: "No Data",
          description: "No transactions found for the selected filters",
          variant: "destructive"
        });
        return;
      }

      const pdfData = {
        expenses: filteredExpenses.map(expense => ({
          ...expense,
          amount: Number(expense.amount),
          date: new Date(expense.date).toISOString()
        })),
        incomes: filteredIncomes.map(income => ({
          ...income,
          amount: Number(income.amount),
          date: new Date(income.date).toISOString()
        })),
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        },
        category: selectedCategory === "all" ? "All Categories" : 
          categories.find(cat => cat.id === selectedCategory)?.name || selectedCategory,
        summary
      };

      const blob = await pdf(
        <FinancialReportPDF {...pdfData} />
      ).toBlob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial-report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF report downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">Analyze your financial data</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            disabled={isGeneratingPdf}
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGeneratingPdf ? "Generating PDF..." : "Export PDF"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select
          value={selectedDateRange}
          onValueChange={setSelectedDateRange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map(range => (
              <SelectItem key={`date-range-${range.value}`} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedDateRange === "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        <Select
          value={selectedCategory}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="all-categories" value="all">All Categories</SelectItem>
            {categories
              .filter(cat => cat.type === "expense")
              .map((category, index) => (
                <SelectItem 
                  key={`category-${category.id || category._id || index}`} 
                  value={category.id || category._id}
                >
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(summary.totalExpenses)}</div>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">
              Avg: {formatCurrency(summary.averageExpense)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(summary.totalIncome)}</div>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">
              Avg: {formatCurrency(summary.averageIncome)}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          summary.netBalance >= 0 
            ? "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900" 
            : "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className={`text-sm font-medium ${
              summary.netBalance >= 0 
                ? "text-blue-700 dark:text-blue-400" 
                : "text-red-700 dark:text-red-400"
            }`}>Net Balance</CardTitle>
            <BarChart2 className={`h-4 w-4 ${
              summary.netBalance >= 0 ? "text-blue-500" : "text-red-500"
            }`} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${
              summary.netBalance >= 0 
                ? "text-blue-700 dark:text-blue-400" 
                : "text-red-700 dark:text-red-400"
            }`}>
              {formatCurrency(summary.netBalance)}
            </div>
            <p className={`text-xs ${
              summary.netBalance >= 0 
                ? "text-blue-600/70 dark:text-blue-400/70" 
                : "text-red-600/70 dark:text-red-400/70"
            }`}>
              {summary.netBalance >= 0 ? 'Positive' : 'Negative'} balance
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">Top Categories</CardTitle>
            <PieChart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-purple-700 dark:text-purple-400">
              <p className="font-medium">Expense: <span className="font-normal">{summary.topExpenseCategory}</span></p>
              <p className="font-medium">Income: <span className="font-normal">{summary.topIncomeCategory}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Overview</CardTitle>
          <CardDescription className="text-xs">Income and expenses over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="expenses" 
                  name="Expenses" 
                  fill="#f87171" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="income" 
                  name="Income" 
                  fill="#4ade80" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
