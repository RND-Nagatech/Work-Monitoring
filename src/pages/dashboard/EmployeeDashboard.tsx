import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/hooks/use-toast';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { dashboardApi, taskApi } from '@/services/api';

type TaskStatus = 'OPEN' | 'ON PROGRESS' | 'DONE';

interface EmployeeTask {
  id: string;
  kode: string;
  deskripsi: string;
  division: string;
  status: TaskStatus;
  deadline: string;
  poin: number;
}

interface EmployeeDashboardData {
  stats: {
    assigned: number;
    inProgress: number;
    completed: number;
    upcoming: number;
  };
  myTasks: EmployeeTask[];
}

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [finishDialog, setFinishDialog] = useState<{ open: boolean; taskId: string | null }>({
    open: false,
    taskId: null,
  });
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await dashboardApi.getEmployeeDashboard();
        const apiData = response.data;

        // Transform API data to match component structure
        const transformedData: EmployeeDashboardData = {
          stats: {
            assigned: apiData.totalTasks,
            inProgress: apiData.tasksByStatus['ON PROGRESS'],
            completed: apiData.tasksByStatus.DONE,
            // Upcoming: tasks with deadline within next 2 days (inclusive) and not overdue
            upcoming: apiData.tasks.filter((t: any) => {
              if (!t.deadline) return false;
              if (t.status_pekerjaan === 'DONE') return false;
              const days = differenceInDays(new Date(t.deadline), new Date());
              return days >= 0 && days <= 2;
            }).length,
          },
          myTasks: apiData.tasks.map((task: any) => ({
            id: task._id,
            kode: task.kode_pekerjaan,
            deskripsi: task.deskripsi,
            division: task.division_name || (typeof task.kode_divisi === 'string' ? task.kode_divisi : task.kode_divisi?.nama_divisi) || 'Unknown',
            status: task.status_pekerjaan,
            deadline: task.deadline,
            poin: task.poin,
          })),
        };

        setData(transformedData);
      } catch (error) {
        console.error('Failed to fetch employee dashboard data:', error);
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

  const getDeadlineColor = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return 'text-destructive';
    if (days <= 2) return 'text-warning';
    return 'text-muted-foreground';
  };

  const handleFinishTask = async () => {
    if (!finishDialog.taskId) return;
    setIsFinishing(true);

    try {
      await taskApi.finish(finishDialog.taskId);

      // Refresh dashboard data
      const response = await dashboardApi.getEmployeeDashboard();
      const apiData = response.data;

      const transformedData: EmployeeDashboardData = {
        stats: {
          assigned: apiData.totalTasks,
          inProgress: apiData.tasksByStatus['ON PROGRESS'],
          completed: apiData.tasksByStatus.DONE,
          upcoming: apiData.tasks.filter((t: any) => {
            if (!t.deadline) return false;
            if (t.status_pekerjaan === 'DONE') return false;
            const days = differenceInDays(new Date(t.deadline), new Date());
            return days >= 0 && days <= 2;
          }).length,
        },
        myTasks: apiData.tasks.map((task: any) => ({
          id: task._id,
          kode: task.kode_pekerjaan,
          deskripsi: task.deskripsi,
          division: task.kode_divisi?.nama_divisi || 'Unknown',
          status: task.status_pekerjaan,
          deadline: task.deadline,
          poin: task.poin,
        })),
      };

      setData(transformedData);

      toast({
        title: 'Task completed!',
        description: 'The task has been marked as done.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete the task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsFinishing(false);
      setFinishDialog({ open: false, taskId: null });
    }
  };

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
          <h1 className="page-header">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subheader">Here's your task overview for today</p>
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
        <h1 className="page-header">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="page-subheader">Here's your task overview for today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Assigned Tasks"
          value={data?.stats.assigned || 0}
          icon={ClipboardList}
          iconClassName="bg-primary"
        />
        <StatCard
          title="In Progress"
          value={data?.stats.inProgress || 0}
          icon={Clock}
          iconClassName="bg-warning"
        />
        <StatCard
          title="Done"
          value={data?.stats.completed || 0}
          icon={CheckCircle2}
          iconClassName="bg-success"
        />
        <StatCard
          title="Upcoming Deadlines"
          value={data?.stats.upcoming || 0}
          icon={AlertCircle}
          iconClassName="bg-destructive"
        />
      </div>

      {/* My Tasks */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">My Tasks</h3>
          <a href="/tasks" className="text-sm text-primary hover:underline">
            View all tasks →
          </a>
        </div>

        <div className="space-y-4">
          {data?.myTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-muted-foreground">{task.kode}</span>
                  <StatusBadge status={task.status} />
                </div>
                <p className="font-medium">{task.deskripsi}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-muted-foreground">{task.division}</span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className={`text-sm flex items-center gap-1 ${getDeadlineColor(task.deadline)}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(task.deadline), 'MMM dd, yyyy')}
                  </span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-primary font-medium">{task.poin} points</span>
                </div>
              </div>
              {task.status === 'ON PROGRESS' && (
                <Button
                  size="sm"
                  onClick={() => setFinishDialog({ open: true, taskId: task.id })}
                >
                  Mark as Done
                </Button>
              )}
            </div>
          ))}

          {data?.myTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tasks assigned to you yet.</p>
              <p className="text-sm mt-1">Check the tasks page to take available tasks.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={finishDialog.open}
        onOpenChange={(open) => setFinishDialog({ open, taskId: null })}
        title="Complete Task"
        description="Are you sure you want to mark this task as done? This action cannot be undone."
        confirmText="Mark as Done"
        onConfirm={handleFinishTask}
        isLoading={isFinishing}
      />
    </div>
  );
}
