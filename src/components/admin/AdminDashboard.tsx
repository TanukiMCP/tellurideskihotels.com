import { useState, useEffect } from 'react';
import { Card } from '@tremor/react';
import { AreaChart, BarChart, DonutChart } from '@tremor/react';
import { Button } from '@/components/ui/Button';
import { 
  DollarSign, 
  TrendingUp, 
  Hotel, 
  Users, 
  Calendar,
  LogOut,
  Banknote,
  Star,
  MapPin
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  topHotels: Array<{
    hotelId: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
  recentBookings: Array<{
    id: string;
    hotelName: string;
    guestName: string;
    checkIn: string;
    amount: number;
    status: string;
  }>;
  weeklyRevenue: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
}

export function AdminDashboard({ user }: { user?: any }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchDashboardStats();
  }, [timeRange]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/stats?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/admin/login';
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <a href="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                  <Hotel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Telluride Ski Hotels</h1>
                  <p className="text-xs text-neutral-500">Admin Dashboard</p>
                </div>
              </a>
              <nav className="flex gap-4">
                <a href="/admin" className="text-sm text-primary-600 font-semibold border-b-2 border-primary-600">
                  Dashboard
                </a>
                <a href="/admin/bookings" className="text-sm text-neutral-600 hover:text-neutral-900 font-medium">
                  Bookings
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">{user?.email}</p>
                <p className="text-xs text-neutral-500">Administrator</p>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Selector */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Analytics Overview</h2>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
                }`}
              >
                {range === '7d' && 'Last 7 Days'}
                {range === '30d' && 'Last 30 Days'}
                {range === '90d' && 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card decoration="top" decorationColor="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Revenue</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">
                  {formatCurrency(stats?.totalRevenue || 0, 'USD')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card decoration="top" decorationColor="blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Bookings</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">
                  {stats?.totalBookings || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card decoration="top" decorationColor="violet">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Avg Booking Value</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">
                  {formatCurrency(stats?.averageBookingValue || 0, 'USD')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </Card>

          <Card decoration="top" decorationColor="amber">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Active Guests</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">
                  {stats?.recentBookings?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <Card>
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Revenue Trend</h3>
            {stats?.weeklyRevenue && stats.weeklyRevenue.length > 0 ? (
              <AreaChart
                className="h-72"
                data={stats.weeklyRevenue}
                index="date"
                categories={["revenue"]}
                colors={["emerald"]}
                valueFormatter={(value) => formatCurrency(value, 'USD')}
                showLegend={false}
                showGridLines={true}
                showAnimation={true}
              />
            ) : (
              <div className="h-72 flex items-center justify-center text-neutral-500">
                No data available
              </div>
            )}
          </Card>

          {/* Top Hotels */}
          <Card>
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Top Performing Hotels</h3>
            {stats?.topHotels && stats.topHotels.length > 0 ? (
              <BarChart
                className="h-72"
                data={stats.topHotels}
                index="name"
                categories={["revenue"]}
                colors={["blue"]}
                valueFormatter={(value) => formatCurrency(value, 'USD')}
                showLegend={false}
                layout="vertical"
                showAnimation={true}
              />
            ) : (
              <div className="h-72 flex items-center justify-center text-neutral-500">
                No data available
              </div>
            )}
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900">Recent Bookings</h3>
            <Button variant="outline" size="sm" onClick={fetchDashboardStats}>
              Refresh
            </Button>
          </div>
          
          {stats?.recentBookings && stats.recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-y border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Hotel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Check-in
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {stats.recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-neutral-900">
                        {booking.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {booking.guestName}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-900">
                        {booking.hotelName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {new Date(booking.checkIn).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900">
                        {formatCurrency(booking.amount, 'USD')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              No bookings yet
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

