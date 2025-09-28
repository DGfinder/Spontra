'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ProviderMetrics {
  providerId: string;
  market: string;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  averageCommission: number;
  expectedEPC: number;
  actualEPC: number;
  epcAccuracy: number;
  last30Days: {
    clicks: number;
    conversions: number;
    revenue: number;
  };
}

interface RevenueMetrics {
  totalRevenue: number;
  totalClicks: number;
  totalConversions: number;
  overallConversionRate: number;
  topPerformingProvider: string;
  projectedMonthlyRevenue: number;
}

export default function RevenueAnalyticsPage() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [providers, setProviders] = useState<ProviderMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      
      // This would be replaced with actual API calls
      // const response = await fetch('/api/admin/analytics/revenue');
      // const data = await response.json();
      
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      const mockMetrics: RevenueMetrics = {
        totalRevenue: 2847.50,
        totalClicks: 12453,
        totalConversions: 89,
        overallConversionRate: 0.71,
        topPerformingProvider: 'kayak-AU',
        projectedMonthlyRevenue: 8500.00
      };

      const mockProviders: ProviderMetrics[] = [
        {
          providerId: 'kayak-AU',
          market: 'AU',
          totalClicks: 4521,
          totalConversions: 34,
          conversionRate: 0.75,
          totalRevenue: 1247.30,
          averageCommission: 36.68,
          expectedEPC: 0.28,
          actualEPC: 0.276,
          epcAccuracy: 98.6,
          last30Days: {
            clicks: 1200,
            conversions: 9,
            revenue: 324.50
          }
        },
        {
          providerId: 'skyscanner-AU',
          market: 'AU',
          totalClicks: 3892,
          totalConversions: 28,
          conversionRate: 0.72,
          totalRevenue: 876.40,
          averageCommission: 31.30,
          expectedEPC: 0.22,
          actualEPC: 0.225,
          epcAccuracy: 102.3,
          last30Days: {
            clicks: 980,
            conversions: 7,
            revenue: 219.10
          }
        },
        {
          providerId: 'jetstar-AU',
          market: 'AU',
          totalClicks: 2145,
          totalConversions: 15,
          conversionRate: 0.70,
          totalRevenue: 456.80,
          averageCommission: 30.45,
          expectedEPC: 0.21,
          actualEPC: 0.213,
          epcAccuracy: 101.4,
          last30Days: {
            clicks: 567,
            conversions: 4,
            revenue: 121.80
          }
        },
        {
          providerId: 'virgin-AU',
          market: 'AU',
          totalClicks: 1895,
          totalConversions: 12,
          conversionRate: 0.63,
          totalRevenue: 267.00,
          averageCommission: 22.25,
          expectedEPC: 0.14,
          actualEPC: 0.141,
          epcAccuracy: 100.7,
          last30Days: {
            clicks: 445,
            conversions: 3,
            revenue: 66.75
          }
        }
      ];

      setMetrics(mockMetrics);
      setProviders(mockProviders);
    } catch (err) {
      setError('Failed to load revenue analytics');
      console.error('Revenue analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium">Error Loading Analytics</div>
          <div className="text-gray-600 mt-2">{error}</div>
          <button 
            onClick={fetchRevenueData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
        <Badge variant="success">Live Data</Badge>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <div className="text-xs text-gray-500 mt-1">All time</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600">Conversion Rate</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {formatPercentage(metrics.overallConversionRate)}
            </div>
            <div className="text-xs text-gray-500 mt-1">{metrics.totalConversions} conversions</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600">Total Clicks</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {metrics.totalClicks.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">All providers</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600">Projected Monthly</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {formatCurrency(metrics.projectedMonthlyRevenue)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Based on current trend</div>
          </Card>
        </div>
      )}

      {/* Provider Performance Table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Provider Performance</h2>
          <p className="text-sm text-gray-600 mt-1">EPC accuracy and revenue metrics by provider</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected EPC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual EPC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.map((provider) => (
                <tr key={`${provider.providerId}-${provider.market}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {provider.providerId}
                      </div>
                      <div className="text-sm text-gray-500">{provider.market}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {provider.totalClicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {provider.totalConversions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPercentage(provider.conversionRate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(provider.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(provider.expectedEPC)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(provider.actualEPC)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={provider.epcAccuracy >= 95 ? 'success' : 
                              provider.epcAccuracy >= 90 ? 'warning' : 'danger'}
                    >
                      {provider.epcAccuracy.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Revenue Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Top Performer</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics?.topPerformingProvider}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Commission</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(providers.reduce((acc, p) => acc + p.averageCommission, 0) / providers.length)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">EPC Accuracy Range</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.min(...providers.map(p => p.epcAccuracy)).toFixed(1)}% - {Math.max(...providers.map(p => p.epcAccuracy)).toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900">High Performers</div>
                <div className="text-gray-600">Kayak and Skyscanner showing strong EPC accuracy</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900">Optimization Opportunity</div>
                <div className="text-gray-600">Virgin Australia has lower conversion rate - investigate pricing</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900">Growth Potential</div>
                <div className="text-gray-600">Consider adding more premium providers for higher commissions</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}