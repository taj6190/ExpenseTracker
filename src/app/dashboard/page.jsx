"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Calendar,
    DollarSign,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const COLORS = ["#4ade80", "#f87171"];

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [latestTransactions, setLatestTransactions] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch expenses
      const expensesResponse = await fetch("/api/expenses");
      if (!expensesResponse.ok) {
        throw new Error("Failed to fetch expenses");
      }
      const expensesData = await expensesResponse.json();
      const expenses = Array.isArray(expensesData) ? expensesData : [];
      
      // Fetch income
      const incomeResponse = await fetch("/api/income");
      if (!incomeResponse.ok) {
        throw new Error("Failed to fetch income");
      }
      const incomeData = await incomeResponse.json();
      const income = Array.isArray(incomeData) ? incomeData : [];

      // Combine and sort all transactions
      const allTransactions = [
        ...expenses.map(exp => ({ ...exp, type: "expense" })),
        ...income.map(inc => ({ ...inc, type: "income" }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calculate totals
      const incomeSum = income.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const expenseSum = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      
      setIncomeTotal(incomeSum);
      setExpenseTotal(expenseSum);
      setBalance(incomeSum - expenseSum);
      
      // Get latest 5 transactions
      setLatestTransactions(allTransactions.slice(0, 5));
      
      // Prepare pie chart data
      setPieData([
        { name: "Income", value: incomeSum },
        { name: "Expenses", value: expenseSum }
      ]);
      
      // Prepare monthly data
      const monthlyData = prepareMonthlyData(allTransactions);
      setMonthlyData(monthlyData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const prepareMonthlyData = (transactions) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 5);

    // Initialize monthly data array
    const monthlyData = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(sixMonthsAgo);
      date.setMonth(sixMonthsAgo.getMonth() + i);
      monthlyData.push({
        month: months[date.getMonth()],
        income: 0,
        expense: 0
      });
    }

    // Fill in the data
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      if (date >= sixMonthsAgo && date <= currentDate) {
        const monthIndex = monthlyData.findIndex(d => d.month === months[date.getMonth()]);
        if (monthIndex !== -1) {
          if (transaction.type === "income") {
            monthlyData[monthIndex].income += Number(transaction.amount);
          } else {
            monthlyData[monthIndex].expense += Number(transaction.amount);
          }
        }
      }
    });

    return monthlyData;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Overview of your financial activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/income")}>
            <DollarSign className="mr-2 h-4 w-4" />
            Add Income
          </Button>
          <Button variant="outline" onClick={() => router.push("/expenses")}>
            <Calendar className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-green-700 dark:text-green-400">
              <ArrowUpCircle className="mr-2 h-5 w-5" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(incomeTotal)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-red-700 dark:text-red-400">
              <ArrowDownCircle className="mr-2 h-5 w-5" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(expenseTotal)}
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br ${
          balance >= 0 
            ? "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900" 
            : "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-lg font-medium flex items-center ${
              balance >= 0 
                ? "text-blue-700 dark:text-blue-400" 
                : "text-red-700 dark:text-red-400"
            }`}>
              <Wallet className="mr-2 h-5 w-5" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              balance >= 0 
                ? "text-blue-700 dark:text-blue-400" 
                : "text-red-700 dark:text-red-400"
            }`}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Income vs Expenses
            </CardTitle>
            <CardDescription>Distribution of your financial activities</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Monthly Trends
            </CardTitle>
            <CardDescription>Income and expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-sm" />
                <YAxis className="text-sm" />
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
                  dataKey="income" 
                  name="Income" 
                  fill="#4ade80" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expense" 
                  name="Expense" 
                  fill="#f87171" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Latest Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Transactions</CardTitle>
          <CardDescription>Your most recent financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Note</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {latestTransactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(transaction.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm">{transaction.category}</td>
                    <td className="px-4 py-3 text-sm">{transaction.description}</td>
                    <td className={`px-4 py-3 text-right text-sm font-medium ${
                      transaction.type === "income" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push("/income")}
              className="flex items-center"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              View All Income
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/expenses")}
              className="flex items-center"
            >
              <Calendar className="mr-2 h-4 w-4" />
              View All Expenses
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard; 