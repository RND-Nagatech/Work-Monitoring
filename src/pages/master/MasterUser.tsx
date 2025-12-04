import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
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
import { toast } from '@/hooks/use-toast';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { userApi, employeeApi } from '@/services/api';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'employee';
  employeeId: string | null;
  employeeName: string | null;
  createdAt: string;
}

export default function MasterUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [formData, setFormData] = useState({ username: '', password: '', role: '' as 'admin' | 'manager' | 'employee' | '', employeeId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, employeesResponse] = await Promise.all([
          userApi.getAll(),
          employeeApi.getAll(),
        ]);
        const rawUsers = usersResponse.data.users || usersResponse.data;
        const rawEmployees = employeesResponse.data.employees || employeesResponse.data;

        const mappedUsers: User[] = rawUsers.map((u: any) => ({
          id: u._id,
          username: u.username,
          role: u.role,
          employeeId: u.pegawai_id?._id || null,
          employeeName: u.pegawai_id?.nama_pegawai || null,
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
        }));

        const mappedEmployees = rawEmployees.map((e: any) => ({
          id: e._id,
          nama: e.nama_pegawai,
        }));

        setUsers(mappedUsers);
        setEmployees(mappedEmployees);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({ title: 'Kesalahan', description: 'Gagal memuat data pengguna. Periksa koneksi Anda.', variant: 'destructive' });
        setUsers([]);
        setEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const resetForm = () => setFormData({ username: '', password: '', role: '', employeeId: '' });

  const handleCreate = async () => {
    if (!formData.username || !formData.password || !formData.role) {
      toast({ title: 'Kesalahan', description: 'Harap isi semua kolom wajib', variant: 'destructive' });
      return;
    }
    if (formData.role === 'employee' && !formData.employeeId) {
      toast({ title: 'Kesalahan', description: 'Harap pilih pegawai untuk peran pegawai', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const userData = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'employee' && { pegawai_id: formData.employeeId })
      };
      const response = await userApi.create(userData);
      const newUser = response.data.user || response.data;

      const mappedUser: User = {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        employeeId: newUser.pegawai_id?._id || null,
        employeeName: newUser.pegawai_id?.nama_pegawai || null,
        createdAt: newUser.createdAt ? new Date(newUser.createdAt).toISOString().split('T')[0] : '',
      };

      setUsers([mappedUser, ...users]);
      setCreateDialog(false);
      resetForm();
      toast({ title: 'Berhasil', description: 'Pengguna berhasil dibuat' });
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({ title: 'Kesalahan', description: 'Gagal membuat pengguna', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editDialog.user) return;
    if (!formData.username || !formData.role) {
      toast({ title: 'Kesalahan', description: 'Harap isi semua kolom wajib', variant: 'destructive' });
      return;
    }
    if (formData.role === 'employee' && !formData.employeeId) {
      toast({ title: 'Kesalahan', description: 'Harap pilih pegawai untuk peran pegawai', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const userData = {
        username: formData.username,
        role: formData.role,
        ...(formData.role === 'employee' && { pegawai_id: formData.employeeId })
      };
      const response = await userApi.update(editDialog.user.id, userData);
      const updatedUser = response.data.user || response.data;

      const mappedUser: User = {
        id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        employeeId: updatedUser.pegawai_id?._id || null,
        employeeName: updatedUser.pegawai_id?.nama_pegawai || null,
        createdAt: updatedUser.createdAt ? new Date(updatedUser.createdAt).toISOString().split('T')[0] : '',
      };

      setUsers(users.map((u) => (u.id === editDialog.user!.id ? mappedUser : u)));
      setEditDialog({ open: false, user: null });
      resetForm();
      toast({ title: 'Berhasil', description: 'Pengguna berhasil diperbarui' });
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({ title: 'Kesalahan', description: 'Gagal memperbarui pengguna', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.userId) return;
    setIsSubmitting(true);
    try {
      await userApi.delete(deleteDialog.userId);
      setUsers(users.filter((u) => u.id !== deleteDialog.userId));
      setDeleteDialog({ open: false, userId: null });
      toast({ title: 'Berhasil', description: 'Pengguna berhasil dihapus' });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({ title: 'Kesalahan', description: 'Gagal menghapus pengguna', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user: User) => {
    setFormData({ username: user.username, password: '', role: user.role, employeeId: user.employeeId || '' });
    setEditDialog({ open: true, user });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  const columns: ColumnDef<User>[] = [
    { accessorKey: 'username', header: 'Nama Pengguna' },
    {
      accessorKey: 'role',
      header: 'Peran',
      cell: ({ row }) => (
        <Badge variant={getRoleBadgeVariant(row.original.role)} className="capitalize">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'employeeName',
      header: 'Pegawai Terhubung',
      cell: ({ row }) => row.original.employeeName || <span className="text-muted-foreground">-</span>,
    },
    { accessorKey: 'createdAt', header: 'Dibuat' },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row.original)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, userId: row.original.id })} disabled={row.original.username === 'admin'}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Master Pengguna</h1>
          <p className="page-subheader">Kelola pengguna dan peran sistem</p>
        </div>
        <Button variant="brand" className="rounded-full" onClick={() => { resetForm(); setCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
        Tambah Pengguna
        </Button>
      </div>

      <DataTable columns={columns} data={users} searchKey="username" searchPlaceholder="Cari pengguna..." />

      <Dialog open={createDialog || editDialog.open} onOpenChange={(open) => { if (!open) { setCreateDialog(false); setEditDialog({ open: false, user: null }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editDialog.user ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Pengguna *</Label>
              <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Nama pengguna" />
            </div>
            {!editDialog.user && (
              <div className="space-y-2">
                <Label>Kata Sandi *</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Kata sandi" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Peran *</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as 'admin' | 'manager' | 'employee' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manajer</SelectItem>
                  <SelectItem value="employee">Pegawai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'employee' && (
              <div className="space-y-2">
                <Label>Tautkan ke Pegawai *</Label>
                <Select value={formData.employeeId} onValueChange={(v) => setFormData({ ...formData, employeeId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pegawai" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => { setCreateDialog(false); setEditDialog({ open: false, user: null }); }}>Batal</Button>
            <Button variant="brand" className="rounded-full" onClick={editDialog.user ? handleEdit : handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : editDialog.user ? 'Perbarui' : 'Buat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, userId: null })}
        title="Hapus Pengguna"
        description="Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
        variant="destructive"
      />
    </div>
  );
}
