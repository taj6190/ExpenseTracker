"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    marginTop: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#bfbfbf",
    minHeight: 30,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 5,
    flex: 1,
  },
  total: {
    marginTop: 20,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "bold",
  },
  categoryTotals: {
    marginTop: 20,
  },
  categoryTotal: {
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
  },
});

export function ExpenseReportPDF({ expenses, dateRange, category }) {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Expense Report</Text>
          <Text style={styles.subtitle}>
            Period: {format(new Date(dateRange.from), "MMM dd, yyyy")} -{" "}
            {format(new Date(dateRange.to), "MMM dd, yyyy")}
          </Text>
          <Text style={styles.subtitle}>Category: {category}</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Date</Text>
            <Text style={styles.tableCell}>Description</Text>
            <Text style={styles.tableCell}>Category</Text>
            <Text style={styles.tableCell}>Amount</Text>
          </View>

          {expenses.map((expense, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>
                {format(new Date(expense.date), "MMM dd, yyyy")}
              </Text>
              <Text style={styles.tableCell}>{expense.description}</Text>
              <Text style={styles.tableCell}>{expense.category}</Text>
              <Text style={styles.tableCell}>${expense.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.total}>Total Expenses: ${total.toFixed(2)}</Text>

        <View style={styles.categoryTotals}>
          <Text style={styles.subtitle}>Category Totals:</Text>
          {Object.entries(categoryTotals).map(([category, amount]) => (
            <Text key={category} style={styles.categoryTotal}>
              {category}: ${amount.toFixed(2)}
            </Text>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated on {format(new Date(), "MMM dd, yyyy 'at' hh:mm a")}
        </Text>
      </Page>
    </Document>
  );
} 