import { useState, useEffect } from 'react';
import { useAuthStore, isAdmin } from '@/stores/authStore';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, Hand, CheckCircle2, CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { taskApi, divisionApi, employeeApi } from '@/services/api';

interface Task {
  id: string;
  kode_pekerjaan: string;
  deskripsi: string;
  division: string;
  divisionId: string;
  status: 'OPEN' | 'ON PROGRESS' | 'DONE';
  poin: number;
  deadline: string;
  pic: string | null;
  picName: string | null;
  tanggal_input: string;
}



export default function Tasks() {
  const { user } = useAuthStore();
  const isAdminUser = isAdmin(user?.role);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [divisionFilter, setDivisionFilter] = useState<string>('');
  
  // Dialogs
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [takeDialog, setTakeDialog] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [finishDialog, setFinishDialog] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [descDialog, setDescDialog] = useState<{ open: boolean; title: string; content: string }>({ open: false, title: '', content: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    kode_pekerjaan: '',
    deskripsi: '',
    divisionId: '',
    poin: 0,
    deadline: undefined as Date | undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: map raw tasks to view model
  const transformTasks = (rawTasks: any[], divisionLookup: Map<string, any>): Task[] => {
    return rawTasks.map((task: any) => ({
      id: task._id,
      kode_pekerjaan: task.kode_pekerjaan,
      deskripsi: task.deskripsi,
      division: divisionLookup.get(task.kode_divisi)?.nama_divisi || task.kode_divisi || 'Unknown',
      divisionId: task.kode_divisi,
      status: task.status_pekerjaan,
      poin: task.poin,
      deadline: task.deadline,
      // Backend now returns `pic` as employee name string or null
      pic: null,
      picName: typeof task.pic === 'string' ? task.pic : null,
      tanggal_input: task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : '',
    }));
  };

  // Helper: refetch tasks based on role
  const refetchTasks = async (divisionLookup: Map<string, any>) => {
    const tasksResponse = await (isAdminUser ? taskApi.getAll() : taskApi.getAvailable());
    const tasksData = tasksResponse.data.tasks || tasksResponse.data;
    setTasks(transformTasks(tasksData, divisionLookup));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tasks based on role
        const tasksResponse = await (isAdminUser ? taskApi.getAll() : taskApi.getAvailable());

        // For admins, fetch divisions and employees; for employees, skip to avoid 403
        let divisionsResponse: any = { data: [] };
        let employeesResponse: any = { data: [] };
        if (isAdminUser) {
          [divisionsResponse, employeesResponse] = await Promise.all([
            divisionApi.getAll(),
            employeeApi.getAll(),
          ]);
        }

        const divisionsData = divisionsResponse.data.divisions || divisionsResponse.data;
        setDivisions(divisionsData);
        const divisionMap = new Map<string, any>();
        divisionsData.forEach((d: any) => divisionMap.set(d.kode_divisi, d));

        const tasksData = tasksResponse.data.tasks || tasksResponse.data;
        // Use unified transformer that treats `pic` as employee name string
        const transformedTasks: Task[] = transformTasks(tasksData, divisionMap);
        setTasks(transformedTasks);
        setEmployees(employeesResponse.data.employees || employeesResponse.data || []);

      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tasks data. Please check your connection.',
          variant: 'destructive',
        });
        // Keep current state to avoid empty flicker
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAdminUser]);

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter && statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (divisionFilter && divisionFilter !== 'all' && task.divisionId !== divisionFilter) return false;
    return true;
  });

  const handleCreateTask = async () => {
    if (!formData.kode_pekerjaan || !formData.deskripsi || !formData.divisionId || !formData.deadline) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await taskApi.create({
        kode_pekerjaan: formData.kode_pekerjaan,
        deskripsi: formData.deskripsi,
        kode_divisi: formData.divisionId,
        poin: formData.poin,
        deadline: format(formData.deadline, 'yyyy-MM-dd'),
      });

      // Refresh tasks
      const divisionLookup = new Map<string, any>();
      divisions.forEach((d: any) => divisionLookup.set(d.kode_divisi, d));
      await refetchTasks(divisionLookup);
      setCreateDialog(false);
      resetForm();
      toast({ title: 'Success', description: 'Task created successfully' });
    } catch (error) {
      console.error('Failed to create task:', error);
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = async () => {
    if (!editDialog.task) return;
    setIsSubmitting(true);
    try {
      await taskApi.update(editDialog.task.id, {
        kode_pekerjaan: formData.kode_pekerjaan,
        deskripsi: formData.deskripsi,
        kode_divisi: formData.divisionId,
        poin: formData.poin,
        deadline: formData.deadline ? format(formData.deadline, 'yyyy-MM-dd') : undefined,
      });

      // Refresh tasks
      const divisionLookup = new Map<string, any>();
      divisions.forEach((d: any) => divisionLookup.set(d.kode_divisi, d));
      await refetchTasks(divisionLookup);
      setEditDialog({ open: false, task: null });
      resetForm();
      toast({ title: 'Success', description: 'Task updated successfully' });
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteDialog.taskId) return;
    setIsSubmitting(true);
    try {
      await taskApi.delete(deleteDialog.taskId);

      // Refresh tasks
      const divisionLookup = new Map<string, any>();
      divisions.forEach((d: any) => divisionLookup.set(d.kode_divisi, d));
      await refetchTasks(divisionLookup);
      setDeleteDialog({ open: false, taskId: null });
      toast({ title: 'Success', description: 'Task deleted successfully' });
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTakeTask = async () => {
    if (!takeDialog.taskId || !user?.employeeId) return;
    setIsSubmitting(true);
    try {
      await taskApi.take(takeDialog.taskId);

      // Refresh tasks (use correct endpoint for role)
      const divisionLookup = new Map<string, any>();
      divisions.forEach((d: any) => divisionLookup.set(d.kode_divisi, d));
      await refetchTasks(divisionLookup);
      setTakeDialog({ open: false, taskId: null });
      toast({ title: 'Success', description: 'Task assigned to you' });
    } catch (error) {
      console.error('Failed to take task:', error);
      toast({ title: 'Error', description: 'Failed to take task', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishTask = async () => {
    if (!finishDialog.taskId) return;
    setIsSubmitting(true);
    try {
      await taskApi.finish(finishDialog.taskId);

      // Refresh tasks (use correct endpoint for role)
      const divisionLookup = new Map<string, any>();
      divisions.forEach((d: any) => divisionLookup.set(d.kode_divisi, d));
      await refetchTasks(divisionLookup);
      setFinishDialog({ open: false, taskId: null });
      toast({ title: 'Success', description: 'Task marked as completed' });
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast({ title: 'Error', description: 'Failed to complete task', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ kode_pekerjaan: '', deskripsi: '', divisionId: '', poin: 0, deadline: undefined });
  };

  const openEditDialog = (task: Task) => {
    setFormData({
      kode_pekerjaan: task.kode_pekerjaan.toUpperCase(),
      deskripsi: task.deskripsi,
      divisionId: task.divisionId,
      poin: task.poin,
      deadline: new Date(task.deadline),
    });
    setEditDialog({ open: true, task });
  };

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: 'kode_pekerjaan',
      header: 'Code',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.kode_pekerjaan}</span>,
    },
    {
      accessorKey: 'deskripsi',
      header: 'Description',
      cell: ({ row }) => (
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => setDescDialog({ open: true, title: `Task ${row.original.kode_pekerjaan}`, content: row.original.deskripsi })}>
            Lihat detail
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'division',
      header: 'Division',
    },
    {
      accessorKey: 'picName',
      header: 'PIC',
      cell: ({ row }) => row.original.picName || <span className="text-muted-foreground">Unassigned</span>,
    },
    {
      accessorKey: 'deadline',
      header: 'Deadline',
      cell: ({ row }) => format(new Date(row.original.deadline), 'MMM dd, yyyy'),
    },
    {
      accessorKey: 'poin',
      header: 'Points',
      cell: ({ row }) => <span className="font-medium text-primary">{row.original.poin}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const task = row.original;
        const isMyTask = task.picName === user?.name;
        const isAvailable = task.pic === null && task.status === 'OPEN';

        if (isAdminUser) {
          return (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, taskId: task.id })}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            {isAvailable && (
              <Button size="sm" variant="outline" onClick={() => setTakeDialog({ open: true, taskId: task.id })}>
                <Hand className="w-4 h-4 mr-1" />
                Take
              </Button>
            )}
            {isMyTask && task.status === 'ON PROGRESS' && (
              <Button size="sm" onClick={() => setFinishDialog({ open: true, taskId: task.id })}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Done
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Tasks</h1>
          <p className="page-subheader">{isAdminUser ? 'Manage all tasks across divisions' : 'View and take available tasks'}</p>
        </div>
        {isAdminUser && (
          <Button variant="brand" className="rounded-full" onClick={() => { resetForm(); setCreateDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 md:p-5 bg-card rounded-2xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Filters</span>
          </div>
          {(statusFilter || divisionFilter) && (
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(''); setDivisionFilter(''); }}>
              Clear
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ON PROGRESS">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Division</Label>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d.kode_divisi} value={d.kode_divisi}>{d.nama_divisi}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filteredTasks} searchKey="deskripsi" searchPlaceholder="Search tasks..." />

      {/* Create/Edit Dialog */}
      <Dialog open={createDialog || editDialog.open} onOpenChange={(open) => { if (!open) { setCreateDialog(false); setEditDialog({ open: false, task: null }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editDialog.task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Code *</Label>
              <Input
                value={formData.kode_pekerjaan}
                onChange={(e) => setFormData({ ...formData, kode_pekerjaan: e.target.value.toUpperCase() })}
                placeholder="e.g., TSK-007"
                disabled={!!editDialog.task}
              />
            </div>
            <div className="space-y-2">
              <Label>Division *</Label>
              <Select value={formData.divisionId} onValueChange={(v) => setFormData({ ...formData, divisionId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.kode_divisi} value={d.kode_divisi}>{d.nama_divisi}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Task description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points *</Label>
                <Input
                  type="number"
                  value={formData.poin}
                  onChange={(e) => setFormData({ ...formData, poin: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !formData.deadline && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? format(formData.deadline, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.deadline} onSelect={(date) => setFormData({ ...formData, deadline: date })} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => { setCreateDialog(false); setEditDialog({ open: false, task: null }); }}>Cancel</Button>
            <Button variant="brand" className="rounded-full" onClick={editDialog.task ? handleEditTask : handleCreateTask} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editDialog.task ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, taskId: null })}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteTask}
        isLoading={isSubmitting}
        variant="destructive"
      />

      <ConfirmDialog
        open={takeDialog.open}
        onOpenChange={(open) => setTakeDialog({ open, taskId: null })}
        title="Take Task"
        description="Are you sure you want to take this task? It will be assigned to you."
        confirmText="Take Task"
        onConfirm={handleTakeTask}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        open={finishDialog.open}
        onOpenChange={(open) => setFinishDialog({ open, taskId: null })}
        title="Complete Task"
        description="Are you sure you want to mark this task as done?"
        confirmText="Mark as Done"
        onConfirm={handleFinishTask}
        isLoading={isSubmitting}
      />

      {/* Description Dialog */}
      <Dialog open={descDialog.open} onOpenChange={(open) => setDescDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{descDialog.title || 'Detail Deskripsi'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm whitespace-pre-wrap break-words text-foreground">{descDialog.content}</p>
          </div>
          <DialogFooter>
            <Button variant="brand" className="rounded-full" onClick={() => setDescDialog({ open: false, title: '', content: '' })}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
