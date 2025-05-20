"use client";

import { format } from "date-fns";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import FormDialog from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

export default function IncomePage() {
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    amount: "",
    category: "",
    date: new Date(),
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIncomes();
    fetchCategories();
  }, []);

  const fetchIncomes = async () => {
    try {
      const response = await fetch('/api/income');
      if (!response.ok) throw new Error('Failed to fetch income');
      const data = await response.json();
      setIncomes(data);
    } catch (error) {
      console.error('Error fetching income:', error);
      toast.error('Failed to load income data');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?type=income');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      const incomeCategories = data.filter(category => category.type === 'income');
      setCategories(incomeCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleOpenDialog = (income = null) => {
    if (income) {
      setFormData({
        id: income._id,
        name: income.name || "",
        amount: income.amount.toString(),
        category: income.category,
        date: new Date(income.date),
        description: income.description || "",
      });
      setIsEditing(true);
    } else {
      setFormData({
        id: null,
        name: "",
        amount: "",
        category: "",
        date: new Date(),
        description: "",
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => setIsDialogOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const incomeData = {
        name: formData.name,
        amount,
        category: formData.category,
        categoryType: 'income',
        date: format(formData.date, "yyyy-MM-dd"),
        description: formData.description,
      };

      const url = isEditing ? `/api/income/${formData.id}` : '/api/income';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incomeData),
      });

      if (!response.ok) {
        throw new Error('Failed to save income');
      }

      await fetchIncomes();
      toast.success(isEditing ? "Income updated successfully" : "Income added successfully");
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving income:", error);
      toast.error("Error saving income");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/income/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete income');
      }

      await fetchIncomes();
      toast.success("Income deleted successfully");
    } catch (error) {
      console.error("Error deleting income:", error);
      toast.error("Error deleting income");
    }
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (item) => format(new Date(item.date), "MMM dd, yyyy")
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true
    },
    {
      key: 'description',
      label: 'Description'
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (item) => formatCurrency(item.amount)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500"
            onClick={() => handleDelete(item._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Income</h1>
          <p className="text-gray-500">Track your income sources</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Add Income
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={incomes}
            columns={columns}
            pageSize={10}
          />
        </CardContent>
      </Card>

      <FormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        title={isEditing ? "Edit Income" : "Add New Income"}
        description={isEditing 
          ? "Update your income details below"
          : "Fill in the details to add a new income record"
        }
        onSubmit={handleSubmit}
        submitText={isEditing ? "Save Changes" : "Add Income"}
        isLoading={loading}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Income Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Salary, Freelance Work"
              className="h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount"
              className="h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((category) => category.type === "income")
                  .map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              className="h-10"
              required
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
