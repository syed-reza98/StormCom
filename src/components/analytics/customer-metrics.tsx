interface CustomerMetricsProps {
  metrics?: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    customerRetentionRate: number;
  };
}

export function CustomerMetrics({ metrics }: CustomerMetricsProps) {
  if (!metrics) {
    return (
      <div className="p-4 text-center text-gray-500">
        No customer data available
      </div>
    );
  }

  return (
    <div data-testid="customer-metrics">
      <div data-testid="total-customers">Total: {metrics.totalCustomers}</div>
      <div data-testid="new-customers">New: {metrics.newCustomers}</div>
      <div data-testid="returning-customers">Returning: {metrics.returningCustomers}</div>
      <div data-testid="retention-rate">Retention: {metrics.customerRetentionRate}%</div>
    </div>
  );
}

export default CustomerMetrics;