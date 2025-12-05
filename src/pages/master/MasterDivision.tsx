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
import { toast } from '@/hooks/use-toast';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { divisionApi } from '@/services/api';

interface Division {
  id: string;
  kode: string;
  nama: string;
  createdAt: string;
}

export default function MasterDivision() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; division: Division | null }>({ open: false, division: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; divisionId: string | null }>({ open: false, divisionId: null });
  const [formData, setFormData] = useState({ kode: '', nama: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const response = await divisionApi.getAll();
        const divisionsData = response.data.divisions || response.data;

        const transformedDivisions: Division[] = divisionsData.map((div: any) => ({
          id: div._id,
          kode: div.kode_divisi,
          nama: div.nama_divisi,
          createdAt: div.createdAt ? new Date(div.createdAt).toISOString().split('T')[0] : '',
        }));

        setDivisions(transformedDivisions);
      } catch (error) {
        console.error('Failed to fetch divisions:', error);
        toast({ title: 'Kesalahan', description: 'Gagal memuat data divisi. Coba lagi.', variant: 'destructive' });
        // Keep divisions as empty array to show error state
      } finally {
        setIsLoading(false);
      }
    };

    fetchDivisions();
  }, []);

  const resetForm = () => setFormData({ kode: '', nama: '' });

  const handleCreate = async () => {
    if (!formData.kode || !formData.nama) {
      toast({ title: 'Kesalahan', description: 'Harap isi semua kolom', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await divisionApi.create({
        kode_divisi: formData.kode.toUpperCase(),
        nama_divisi: formData.nama,
      });

      // Refresh divisions
      const response = await divisionApi.getAll();
      const divisionsData = response.data.divisions || response.data;
      const transformedDivisions: Division[] = divisionsData.map((div: any) => ({
        id: div._id,
        kode: div.kode_divisi,
        nama: div.nama_divisi,
        createdAt: div.createdAt ? new Date(div.createdAt).toISOString().split('T')[0] : '',
      }));

      setDivisions(transformedDivisions);
      setCreateDialog(false);
      resetForm();
      toast({ title: 'Berhasil', description: 'Divisi berhasil dibuat' });
    } catch (error) {
      console.error('Failed to create division:', error);
      toast({ title: 'Kesalahan', description: 'Gagal membuat divisi', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editDialog.division) return;
    setIsSubmitting(true);
    try {
      await divisionApi.update(editDialog.division.id, {
        kode_divisi: formData.kode.toUpperCase(),
        nama_divisi: formData.nama,
      });

      const response = await divisionApi.getAll();
      const divisionsData = response.data.divisions || response.data;
      const transformedDivisions: Division[] = divisionsData.map((div: any) => ({
        id: div._id,
        kode: div.kode_divisi,
        nama: div.nama_divisi,
        createdAt: div.createdAt ? new Date(div.createdAt).toISOString().split('T')[0] : '',
      }));

      setDivisions(transformedDivisions);
      setEditDialog({ open: false, division: null });
      resetForm();
      toast({ title: 'Berhasil', description: 'Divisi berhasil diperbarui' });
    } catch {
      toast({ title: 'Kesalahan', description: 'Gagal memperbarui divisi', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.divisionId) return;
    setIsSubmitting(true);
    try {
      await divisionApi.delete(deleteDialog.divisionId);

      const response = await divisionApi.getAll();
      const divisionsData = response.data.divisions || response.data;
      const transformedDivisions: Division[] = divisionsData.map((div: any) => ({
        id: div._id,
        kode: div.kode_divisi,
        nama: div.nama_divisi,
        createdAt: div.createdAt ? new Date(div.createdAt).toISOString().split('T')[0] : '',
      }));

      setDivisions(transformedDivisions);
      setDeleteDialog({ open: false, divisionId: null });
      toast({ title: 'Berhasil', description: 'Divisi berhasil dihapus' });
    } catch {
      toast({ title: 'Kesalahan', description: 'Gagal menghapus divisi', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (division: Division) => {
    setFormData({ kode: division.kode, nama: division.nama.toUpperCase() });
    setEditDialog({ open: true, division });
  };

  const columns: ColumnDef<Division>[] = [
    { accessorKey: 'kode', header: 'Kode', cell: ({ row }) => <span className="font-mono">{row.original.kode}</span> },
    { accessorKey: 'nama', header: 'Nama' },
    { accessorKey: 'createdAt', header: 'Dibuat' },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row.original)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, divisionId: row.original.id })}>
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
            <h1 className="page-header">Master Divisi</h1>
            <p className="page-subheader">Kelola Master Divisi</p>
          </div>
          <Button variant="brand" className="rounded-full" onClick={() => { resetForm(); setCreateDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Divisi
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-semibold mb-2">Belum ada divisi</h3>
            <p className="text-muted-foreground mb-4">Mulai dengan menambahkan divisi pertama Anda.</p>
            <Button variant="brand" className="rounded-full" onClick={() => { resetForm(); setCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Divisi
            </Button>
          </div>
        </div>

        {/* Dialogs should always be rendered so the Add button works in empty state */}
        <Dialog open={createDialog || editDialog.open} onOpenChange={(open) => { if (!open) { setCreateDialog(false); setEditDialog({ open: false, division: null }); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editDialog.division ? 'Edit Divisi' : 'Tambah Divisi'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Kode Divisi *</Label>
                <Input value={formData.kode} onChange={(e) => setFormData({ ...formData, kode: e.target.value })} placeholder="mis., IT" disabled={!!editDialog.division} />
              </div>
              <div className="space-y-2">
                <Label>Nama Divisi *</Label>
                <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })} placeholder="mis., Divisi IT" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => { setCreateDialog(false); setEditDialog({ open: false, division: null }); }}>Batal</Button>
              <Button variant="brand" className="rounded-full" onClick={editDialog.division ? handleEdit : handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : editDialog.division ? 'Perbarui' : 'Buat'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, divisionId: null })}
          title="Hapus Divisi"
          description="Anda yakin ingin menghapus divisi ini? Tindakan ini tidak dapat dibatalkan."
          confirmText="Hapus"
          onConfirm={handleDelete}
          isLoading={isSubmitting}
          variant="destructive"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Master Divisi</h1>
          <p className="page-subheader">Kelola data divisi</p>
        </div>
        <Button variant="brand" className="rounded-full" onClick={() => { resetForm(); setCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Divisi
        </Button>
      </div>

      <DataTable columns={columns} data={divisions} searchKey="nama" searchPlaceholder="Cari divisi..." />

      <Dialog open={createDialog || editDialog.open} onOpenChange={(open) => { if (!open) { setCreateDialog(false); setEditDialog({ open: false, division: null }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editDialog.division ? 'Edit Divisi' : 'Tambah Divisi'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kode Divisi *</Label>
              <Input value={formData.kode} onChange={(e) => setFormData({ ...formData, kode: e.target.value })} placeholder="mis., IT" disabled={!!editDialog.division} />
            </div>
            <div className="space-y-2">
              <Label>Nama Divisi *</Label>
              <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })} placeholder="mis., Divisi IT" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => { setCreateDialog(false); setEditDialog({ open: false, division: null }); }}>Batal</Button>
            <Button variant="brand" className="rounded-full" onClick={editDialog.division ? handleEdit : handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : editDialog.division ? 'Perbarui' : 'Buat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, divisionId: null })}
        title="Hapus Divisi"
        description="Anda yakin ingin menghapus divisi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
        variant="destructive"
      />
    </div>
  );
}
