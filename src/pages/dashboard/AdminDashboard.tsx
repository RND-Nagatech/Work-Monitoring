import { useState, useEffect } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const COLORS = ['hsl(38, 92%, 50%)', 'hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'];

interface DashboardData {
  stats: {
    totalOpen: number;
    totalOnProgress: number;
    totalDone: number;
    totalTasks: number;
  };
  employeeStats: Array<{
    name: string; // employee name
    onProgress: number;
    done: number;
  }>;
  recentTasks: Array<{
    id: string;
    kode: string;
    deskripsi: string;
    division: string;
    status: 'OPEN' | 'ON PROGRESS' | 'DONE';
    deadline: string;
    pic: string | null;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHoveringBar, setIsHoveringBar] = useState(false);
  const [hoverKey, setHoverKey] = useState<'onProgress' | 'done' | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await dashboardApi.getAdminDashboard();
        const apiData = response.data;

        // Transform API data to match component structure
        // Build employee-based stats from tasks grouped by division
        const allTasks = Array.isArray(apiData.tasksByDivision)
          ? apiData.tasksByDivision.flatMap((div: any) => div.tasks || [])
          : Array.isArray(apiData.tasks)
            ? apiData.tasks
            : [];

        const employeeMap = new Map<string, { onProgress: number; done: number }>();
        for (const t of allTasks) {
          const name = typeof t?.pic === 'string' && t.pic.trim() !== '' ? t.pic : 'Tanpa PIC';
          if (!employeeMap.has(name)) employeeMap.set(name, { onProgress: 0, done: 0 });
          if (t?.status_pekerjaan === 'ON PROGRESS') employeeMap.get(name)!.onProgress += 1;
          if (t?.status_pekerjaan === 'DONE') employeeMap.get(name)!.done += 1;
        }

        const transformedData: DashboardData = {
          stats: {
            totalOpen: apiData.tasksByStatus.OPEN,
            totalOnProgress: apiData.tasksByStatus['ON PROGRESS'],
            totalDone: apiData.tasksByStatus.DONE,
            totalTasks: apiData.totalTasks,
          },
          employeeStats: Array.from(employeeMap.entries()).map(([name, v]) => ({ name, ...v })),
          recentTasks: apiData.onProgressTasks.slice(0, 5).map((task: any) => ({
            id: task._id,
            kode: task.kode_pekerjaan,
            deskripsi: task.deskripsi,
            division: typeof task.kode_divisi === 'string' ? task.kode_divisi : (task.kode_divisi?.nama_divisi || 'Unknown'),
            status: task.status_pekerjaan,
            deadline: task.deadline,
            pic: typeof task.pic === 'string' ? task.pic : null,
          })),
        };

        setData(transformedData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
        // Keep data as null to show error state
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const pieData = data ? [
    { name: 'Open', value: data.stats.totalOpen },
    { name: 'In Progress', value: data.stats.totalOnProgress },
    { name: 'Done', value: data.stats.totalDone },
  ] : [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="page-subheader">Overview of all tasks and divisions</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
            <p className="text-muted-foreground">Unable to connect to the server. Please check your connection and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subheader">Overview of all tasks and divisions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={data?.stats.totalTasks || 0}
          icon={ClipboardList}
          iconClassName="bg-primary"
        />
        <StatCard
          title="Open Tasks"
          value={data?.stats.totalOpen || 0}
          icon={AlertCircle}
          iconClassName="bg-warning"
        />
        <StatCard
          title="In Progress"
          value={data?.stats.totalOnProgress || 0}
          icon={Clock}
          iconClassName="bg-primary"
        />
        <StatCard
          title="Done"
          value={data?.stats.totalDone || 0}
          icon={CheckCircle2}
          iconClassName="bg-success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Tasks by Employee */}
        <div className="lg:col-span-2 stat-card">
          <h3 className="text-lg font-semibold mb-6">Tasks by Employee</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data?.employeeStats || []}
              barGap={0}
              barCategoryGap={28}
              margin={{ top: 10, right: 20, left: 20, bottom: 32 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, textAnchor: 'middle' }}
                interval={0}
                tickLine={false}
                tickMargin={10}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                allowDecimals={false}
                domain={[0, 'dataMax + 1']}
                tickFormatter={(v) => Math.round(Number(v)).toString()}
              />
              <Tooltip
                cursor={false}
                content={(props) => {
                  if (!isHoveringBar || !hoverKey) return null;
                  const { label, payload } = props as any;
                  if (!payload || !payload.length) return null;
                  const entry = payload.find((p: any) => p.dataKey === hoverKey);
                  if (!entry) return null;
                  return (
                    <div style={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      padding: 10,
                    }}>
                      <div className="font-semibold">{label}</div>
                      {hoverKey === 'onProgress' && (
                        <div className="text-primary">In Progress : {entry.value ?? 0}</div>
                      )}
                      {hoverKey === 'done' && (
                        <div className="text-success">Done : {entry.value ?? 0}</div>
                      )}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="onProgress"
                stackId="a"
                fill="hsl(217, 91%, 60%)"
                name="In Progress"
                radius={[0, 0, 4, 4]}
                barSize={44}
                onMouseOver={() => { setIsHoveringBar(true); setHoverKey('onProgress'); }}
                onMouseOut={() => { setIsHoveringBar(false); setHoverKey(null); }}
              />
              <Bar
                dataKey="done"
                stackId="a"
                fill="hsl(142, 76%, 36%)"
                name="Done"
                radius={[4, 4, 0, 0]}
                barSize={44}
                onMouseOver={() => { setIsHoveringBar(true); setHoverKey('done'); }}
                onMouseOut={() => { setIsHoveringBar(false); setHoverKey(null); }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Task Status Distribution */}
        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-6">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-xs text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Division Cards and Recent Tasks removed per request */}
    </div>
  );
}
