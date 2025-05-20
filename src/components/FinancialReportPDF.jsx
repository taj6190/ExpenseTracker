import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
  },
  header: {
    marginBottom: 10,
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 8,
    marginBottom: 2,
    color: "#666",
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
    backgroundColor: "#f0f0f0",
    padding: 2,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 5,
  },
  summaryItem: {
    width: "33.33%",
    padding: 2,
  },
  summaryLabel: {
    fontSize: 7,
    color: "#666",
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 0.5,
    borderColor: "#bfbfbf",
    marginTop: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#bfbfbf",
    minHeight: 20,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 2,
    flex: 1,
  },
  categorySection: {
    marginTop: 5,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 1,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: "center",
    fontSize: 7,
    color: "#666",
  },
  twoColumnLayout: {
    flexDirection: "row",
    marginTop: 5,
  },
  column: {
    flex: 1,
    marginHorizontal: 2,
  },
});

export function FinancialReportPDF({ expenses, incomes, dateRange, category, summary }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Financial Report</Text>
          <Text style={styles.subtitle}>
            {format(new Date(dateRange.from), "MMM dd, yyyy")} -{" "}
            {format(new Date(dateRange.to), "MMM dd, yyyy")} | {category}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={[styles.summaryValue, { color: "#4ade80" }]}>
                {formatCurrency(summary.totalIncome)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={[styles.summaryValue, { color: "#f87171" }]}>
                {formatCurrency(summary.totalExpenses)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net Balance</Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: summary.netBalance >= 0 ? "#60a5fa" : "#f87171",
                  },
                ]}
              >
                {formatCurrency(summary.netBalance)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Avg Income</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(summary.averageIncome)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Avg Expense</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(summary.averageExpense)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Top Categories</Text>
              <Text style={styles.summaryValue}>
                {summary.topIncomeCategory} / {summary.topExpenseCategory}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.twoColumnLayout}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Income</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Date</Text>
                <Text style={styles.tableCell}>Category</Text>
                <Text style={styles.tableCell}>Amount</Text>
              </View>
              {incomes.map((income, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>
                    {format(new Date(income.date), "MMM dd")}
                  </Text>
                  <Text style={styles.tableCell}>{income.category}</Text>
                  <Text style={[styles.tableCell, { color: "#4ade80" }]}>
                    {formatCurrency(income.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Date</Text>
                <Text style={styles.tableCell}>Category</Text>
                <Text style={styles.tableCell}>Amount</Text>
              </View>
              {expenses.map((expense, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>
                    {format(new Date(expense.date), "MMM dd")}
                  </Text>
                  <Text style={styles.tableCell}>{expense.category}</Text>
                  <Text style={[styles.tableCell, { color: "#f87171" }]}>
                    {formatCurrency(expense.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated on {format(new Date(), "MMM dd, yyyy 'at' hh:mm a")}
        </Text>
      </Page>
    </Document>
  );
} 