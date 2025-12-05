import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
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
import { toast } from '@/hooks/use-toast';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { employeeApi, divisionApi } from '@/services/api';

interface Employee {
  id: string;
  nip: string;
  nama: string;
  divisionId: string;
  divisionName: string;
  createdAt: string;
}

export default function MasterEmployee() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; employeeId: string | null }>({ open: false, employeeId: null });
  const [formData, setFormData] = useState({ nip: '', nama: '', divisionId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesResponse, divisionsResponse] = await Promise.all([
          employeeApi.getAll(),
          divisionApi.getAll(),
        ]);

        const divisionsData = divisionsResponse.data.divisions || divisionsResponse.data;
        setDivisions(divisionsData);

        const employeesData = employeesResponse.data.employees || employeesResponse.data;
        const transformedEmployees: Employee[] = employeesData.map((emp: any) => {
          const div = divisionsData.find((d: any) => d.kode_divisi === emp.kode_divisi);
          return {
            id: emp._id,
            nip: emp.kode_pegawai,
            nama: emp.nama_pegawai,
            divisionId: emp.kode_divisi || '',
            divisionName: div?.nama_divisi || 'Tidak diketahui',
            createdAt: emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : '',
          };
        });

        setEmployees(transformedEmployees);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({ title: 'Kesalahan', description: 'Gagal memuat data pegawai. Coba lagi.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const resetForm = () => setFormData({ nip: '', nama: '', divisionId: '' });

  const handleCreate = async () => {
    if (!formData.nip || !formData.nama || !formData.divisionId) {
      toast({ title: 'Kesalahan', description: 'Harap isi semua kolom', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await employeeApi.create({
        kode_pegawai: formData.nip,
        nama_pegawai: formData.nama,
        kode_divisi: formData.divisionId, // division code string
      });

      // Refresh employees
      const [employeesResponse, divisionsResponse] = await Promise.all([
        employeeApi.getAll(),
        divisionApi.getAll(),
      ]);
      const divisionsData = divisionsResponse.data.divisions || divisionsResponse.data;
      const employeesData = employeesResponse.data.employees || employeesResponse.data;
      const transformedEmployees: Employee[] = employeesData.map((emp: any) => {
        const div = divisionsData.find((d: any) => d.kode_divisi === emp.kode_divisi);
        return {
          id: emp._id,
          nip: emp.kode_pegawai,
          nama: emp.nama_pegawai,
          divisionId: emp.kode_divisi || '',
          divisionName: div?.nama_divisi || 'Tidak diketahui',
          createdAt: emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : '',
        };
      });

      setEmployees(transformedEmployees);
      setCreateDialog(false);
      resetForm();
      toast({ title: 'Berhasil', description: 'Pegawai berhasil dibuat' });
    } catch (error) {
      console.error('Failed to create employee:', error);
      toast({ title: 'Kesalahan', description: 'Gagal membuat pegawai', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editDialog.employee) return;
    setIsSubmitting(true);
    try {
      await employeeApi.update(editDialog.employee.id, {
        kode_pegawai: formData.nip,
        nama_pegawai: formData.nama,
        kode_divisi: formData.divisionId, // division code string
      });
      
      // Refresh employees
      const [employeesResponse, divisionsResponse] = await Promise.all([
        employeeApi.getAll(),
        divisionApi.getAll(),
      ]);
      const divisionsData = divisionsResponse.data.divisions || divisionsResponse.data;
      const employeesData = employeesResponse.data.employees || employeesResponse.data;
      const transformedEmployees: Employee[] = employeesData.map((emp: any) => {
        const div = divisionsData.find((d: any) => d.kode_divisi === emp.kode_divisi);
        return {
          id: emp._id,
          nip: emp.kode_pegawai,
          nama: emp.nama_pegawai,
          divisionId: emp.kode_divisi || '',
          divisionName: div?.nama_divisi || 'Tidak diketahui',
          createdAt: emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : '',
        };
      });

      setEmployees(transformedEmployees);
      setEditDialog({ open: false, employee: null });
      resetForm();
      toast({ title: 'Berhasil', description: 'Pegawai berhasil diperbarui' });
    } catch (error) {
      console.error('Failed to update employee:', error);
      toast({ title: 'Kesalahan', description: 'Gagal memperbarui pegawai', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.employeeId) return;
    setIsSubmitting(true);
    try {
      await employeeApi.delete(deleteDialog.employeeId);

      // Refresh employees
      const [employeesResponse, divisionsResponse] = await Promise.all([
        employeeApi.getAll(),
        divisionApi.getAll(),
      ]);
      const divisionsData = divisionsResponse.data.divisions || divisionsResponse.data;
      const employeesData = employeesResponse.data.employees || employeesResponse.data;
      const transformedEmployees: Employee[] = employeesData.map((emp: any) => {
        const div = divisionsData.find((d: any) => d.kode_divisi === emp.kode_divisi);
        return {
          id: emp._id,
          nip: emp.kode_pegawai,
          nama: emp.nama_pegawai,
          divisionId: emp.kode_divisi || '',
          divisionName: div?.nama_divisi || 'Tidak diketahui',
          createdAt: emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : '',
        };
      });

      setEmployees(transformedEmployees);
      setDeleteDialog({ open: false, employeeId: null });
      toast({ title: 'Berhasil', description: 'Pegawai berhasil dihapus' });
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast({ title: 'Kesalahan', description: 'Gagal menghapus pegawai', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const openEditDialog = (employee: Employee) => {
    setFormData({ nip: employee.nip, nama: employee.nama.toUpperCase(), divisionId: employee.divisionId });
    setEditDialog({ open: true, employee });
  };

  const columns: ColumnDef<Employee>[] = [
    { accessorKey: 'nip', header: 'Kode Pegawai' },
    { accessorKey: 'nama', header: 'Nama' },
    { accessorKey: 'divisionName', header: 'Divisi' },
    { accessorKey: 'createdAt', header: 'Dibuat' },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row.original)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, employeeId: row.original.id })}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (divisions.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Master Pegawai</h1>
            <p className="page-subheader">Kelola data pegawai</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-semibold mb-2">Belum ada divisi</h3>
            <p className="text-muted-foreground">Silakan buat divisi terlebih dahulu sebelum menambah pegawai.</p>
          </div>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Master Pegawai</h1>
            <p className="page-subheader">Kelola data pegawai</p>
          </div>
          <Button variant="brand" className="rounded-full" onClick={() => { resetForm(); setCreateDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pegawai
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2">Belum ada pegawai</h3>
            <p className="text-muted-foreground mb-4">Mulai dengan menambahkan pegawai pertama Anda.</p>
            <Button variant="brand" className="rounded-full" onClick={() => { resetForm(); setCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pegawai
            </Button>
          </div>
        </div>

        {/* Ensure dialogs are rendered in empty state so Add works */}
        <Dialog open={createDialog || editDialog.open} onOpenChange={(open) => { if (!open) { setCreateDialog(false); setEditDialog({ open: false, employee: null }); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editDialog.employee ? 'Edit Pegawai' : 'Tambah Pegawai'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Kode Pegawai</Label>
                <Input value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} placeholder="e.g., 005" disabled={!!editDialog.employee} />
              </div>
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })} placeholder="Nama pegawai" />
              </div>
              <div className="space-y-2">
                <Label>Divisi *</Label>
                <Select value={formData.divisionId} onValueChange={(v) => setFormData({ ...formData, divisionId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((d) => (
                      <SelectItem key={d.kode_divisi} value={d.kode_divisi}>{d.nama_divisi}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => { setCreateDialog(false); setEditDialog({ open: false, employee: null }); }}>Batal</Button>
              <Button variant="brand" className="rounded-full" onClick={editDialog.employee ? handleEdit : handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : editDialog.employee ? 'Perbarui' : 'Buat'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, employeeId: null })}
          title="Hapus Pegawai"
          description="Anda yakin ingin menghapus pegawai ini? Tindakan ini tidak dapat dibatalkan."
          confirmText="Hapus"
          onConfirm={handleDelete}
          isLoading={isSubmitting}
          variant="destructive"
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Master Pegawai</h1>
          <p className="page-subheader">Kelola data pegawai</p>
        </div>
        <Button variant="brand" className="rounded-full" onClick={() => { resetForm(); setCreateDialog(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pegawai
        </Button>
      </div>

      <DataTable columns={columns} data={employees} searchKey="nama" searchPlaceholder="Cari pegawai..." />

      <Dialog open={createDialog || editDialog.open} onOpenChange={(open) => { if (!open) { setCreateDialog(false); setEditDialog({ open: false, employee: null }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editDialog.employee ? 'Edit Pegawai' : 'Tambah Pegawai'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kode Pegawai</Label>
              <Input value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} placeholder="e.g., 005" disabled={!!editDialog.employee} />
            </div>
            <div className="space-y-2">
              <Label>Nama *</Label>
              <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })} placeholder="Nama pegawai" />
            </div>
            <div className="space-y-2">
              <Label>Divisi *</Label>
              <Select value={formData.divisionId} onValueChange={(v) => setFormData({ ...formData, divisionId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.kode_divisi} value={d.kode_divisi}>{d.nama_divisi}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => { setCreateDialog(false); setEditDialog({ open: false, employee: null }); }}>Batal</Button>
            <Button variant="brand" className="rounded-full" onClick={editDialog.employee ? handleEdit : handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : editDialog.employee ? 'Perbarui' : 'Buat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, employeeId: null })}
        title="Hapus Pegawai"
        description="Anda yakin ingin menghapus pegawai ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
        variant="destructive"
      />
    </div>
  );
}
