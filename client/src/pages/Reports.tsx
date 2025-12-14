import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { BadgeCheck, Clock, Gauge, HelpCircle, Calendar, LineChart as LineChartIcon, Building, Users } from "lucide-react";

export default function Reports() {
  const navigate = useNavigate();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [reportType, setReportType] = useState("dashboard");

  // Redirect if not admin
  if (!isLoadingAuth && user && user.role !== 'admin') {
    navigate("/dashboard");
    return null;
  }

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports", reportType],
    queryFn: async () => {
      const url = `/api/reports?type=${reportType}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });

  if (isLoadingAuth || isLoading) {
    return (
      <div className="py-6">
        <Helmet>
          <title>Reports - RepairRequest</title>
        </Helmet>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse h-8 w-64 bg-gray-200 rounded mb-6"></div>
          <div className="animate-pulse h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Format data for different chart types
  const formatMonthlyData = () => {
    if (!reportData?.data || reportType !== 'monthly') return [];

    const months = Array.from(new Set(reportData.data.map((item: any) => item.month))).sort();

    return months.map(month => {
      const monthData = reportData.data.filter((item: any) => item.month === month);

      return {
        month,
        pending: monthData.find((item: any) => item.status === 'pending')?.count || 0,
        approved: monthData.find((item: any) => item.status === 'approved')?.count || 0,
        inProgress: monthData.find((item: any) => item.status === 'in-progress')?.count || 0,
        completed: monthData.find((item: any) => item.status === 'completed')?.count || 0,
        cancelled: monthData.find((item: any) => item.status === 'cancelled')?.count || 0,
      };
    });
  };

  const formatFacilityData = () => {
    if (!reportData?.data || reportType !== 'facility') return [];

    return reportData.data.map((item: any) => ({
      name: item.facility,
      value: item.count
    }));
  };

  const formatStatusData = () => {
    if (!reportData?.data || reportType !== 'status') return [];

    return reportData.data.map((item: any) => ({
      name: item.status === 'in-progress' ? 'In Progress' :
        item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item.count
    }));
  };

  const formatCompletionData = () => {
    if (!reportData?.data || reportType !== 'completion') return [];

    // Group by completion time (days)
    const grouped = reportData.data.reduce((acc: any, item: any) => {
      if (item.timeToComplete === null) return acc;

      const timeGroup =
        item.timeToComplete <= 1 ? '0-1 days' :
          item.timeToComplete <= 3 ? '1-3 days' :
            item.timeToComplete <= 7 ? '3-7 days' :
              '7+ days';

      if (!acc[timeGroup]) acc[timeGroup] = 0;
      acc[timeGroup]++;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  };

  const formatTypeData = () => {
    if (!reportData?.data || reportType !== 'requestType') return [];

    return reportData.data.map((item: any) => ({
      name: item.requestType === 'facilities' ? 'Facilities' : 'Building',
      value: item.count
    }));
  };

  const formatStaffData = () => {
    if (!reportData?.data || reportType !== 'staff') return [];

    return reportData.data.map((item: any) => ({
      name: item.name || 'Unassigned',
      completed: item.completedCount || 0,
      pending: item.pendingCount || 0,
      total: item.totalCount || 0,
      avgCompletionTime: item.avgCompletionTime || 0
    }));
  };

  const formatPerformanceData = () => {
    if (!reportData?.data || reportType !== 'performance') return [];

    const metrics = reportData.data.metrics || [];
    return metrics.map((item: any) => ({
      month: item.month,
      avgResponseTime: item.avgResponseTime || 0,
      avgResolutionTime: item.avgResolutionTime || 0,
      requestsPerDay: item.requestsPerDay || 0
    }));
  };

  // Format dashboard overview data
  const formatDashboardData = () => {
    if (!reportData?.data || reportType !== 'dashboard') return {
      kpis: [],
      requestsByMonth: [],
      requestsByType: [],
      requestsByStatus: [],
      topFacilities: []
    };

    return {
      kpis: reportData.data.kpis || [],
      requestsByMonth: reportData.data.requestsByMonth || [],
      requestsByType: reportData.data.requestsByType || [],
      requestsByStatus: reportData.data.requestsByStatus || [],
      topFacilities: reportData.data.topFacilities || []
    };
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const STATUS_COLORS = {
    pending: '#FFBB28',
    approved: '#82ca9d',
    'in-progress': '#0088FE',
    completed: '#00C49F',
    cancelled: '#FF8042'
  };

  const dashboardData = formatDashboardData();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">Maintenance Analytics Dashboard</h1>

        <Tabs defaultValue="dashboard" value={reportType} onValueChange={setReportType}>
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
            <TabsTrigger value="facility">By Building</TabsTrigger>
            <TabsTrigger value="status">By Status</TabsTrigger>
            <TabsTrigger value="completion">Completion Time</TabsTrigger>
            <TabsTrigger value="requestType">Request Types</TabsTrigger>
            <TabsTrigger value="staff">Staff Performance</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {dashboardData.kpis.map((kpi: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">{kpi.value}</div>
                      <div className={`flex items-center ${kpi.trend > 0 ? 'text-green-500' : kpi.trend < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {kpi.trend > 0 ? '↑' : kpi.trend < 0 ? '↓' : '—'}
                        <span className="ml-1">{Math.abs(kpi.trend)}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Monthly Requests Trend */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Monthly Request Trend</CardTitle>
                <CardDescription>Total maintenance requests over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData.requestsByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="total" name="Total Requests" fill="#8884d8" stroke="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status and Type Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.requestsByStatus}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {dashboardData.requestsByStatus.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Request Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.requestsByType}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {dashboardData.requestsByType.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F'][index % 2]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Buildings */}
            <Card>
              <CardHeader>
                <CardTitle>Top Requested Buildings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.topFacilities} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Request Count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Request Trends</CardTitle>
                <CardDescription>Breakdown of requests by status over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatMonthlyData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="pending" name="Pending" fill="#FFBB28" />
                      <Bar dataKey="approved" name="Approved" fill="#82ca9d" />
                      <Bar dataKey="inProgress" name="In Progress" fill="#0088FE" />
                      <Bar dataKey="completed" name="Completed" fill="#00C49F" />
                      <Bar dataKey="cancelled" name="Cancelled" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facility">
            <Card>
              <CardHeader>
                <CardTitle>Requests by Building</CardTitle>
                <CardDescription>Distribution of maintenance requests across different buildings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatFacilityData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatFacilityData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Requests by Status</CardTitle>
                <CardDescription>Current distribution of request statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatStatusData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completion">
            <Card>
              <CardHeader>
                <CardTitle>Request Completion Time</CardTitle>
                <CardDescription>Analysis of how quickly requests are being completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatCompletionData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Number of Requests" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requestType">
            <Card>
              <CardHeader>
                <CardTitle>Requests by Type</CardTitle>
                <CardDescription>Distribution between Facilities and Building requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatTypeData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatTypeData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F'][index % 2]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff Performance Metrics</CardTitle>
                <CardDescription>Performance analysis of maintenance personnel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatStaffData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Completed Requests" fill="#00C49F" />
                      <Bar dataKey="pending" name="Pending Requests" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Average Completion Time by Staff</CardTitle>
                <CardDescription>Average days to complete maintenance requests by staff member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatStaffData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgCompletionTime" name="Avg. Days to Complete" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics Over Time</CardTitle>
                <CardDescription>Operational efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatPerformanceData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgResponseTime" name="Avg. Response Time (days)" stroke="#0088FE" />
                      <Line type="monotone" dataKey="avgResolutionTime" name="Avg. Resolution Time (days)" stroke="#00C49F" />
                      <Line type="monotone" dataKey="requestsPerDay" name="Requests Per Day" stroke="#FFBB28" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
