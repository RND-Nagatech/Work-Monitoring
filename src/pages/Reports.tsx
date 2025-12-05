import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reportApi, divisionApi } from '@/services/api';
import { formatStatus } from '@/lib/utils';

interface ReportItem {
  id: string;
  kode_pekerjaan: string;
  deskripsi: string;
  division: string;
  picName: string | null;
  status: 'OPEN' | 'ON PROGRESS' | 'DONE';
  poin: number;
  deadline: string;
  tanggal_input: string;
  tanggal_selesai: string | null;
}

export default function Reports() {
  const [data, setData] = useState<ReportItem[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateFieldType, setDateFieldType] = useState<'tanggal_input' | 'tanggal_selesai'>('tanggal_input');
  const [isLoading, setIsLoading] = useState(true);
  type FilterKind = 'none' | 'top_points' | 'top_tasks';
  const [filterType, setFilterType] = useState<FilterKind>('none');
  const [serverRanking, setServerRanking] = useState<Array<{ name: string; value: number }> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch divisions
        const divisionsResponse = await divisionApi.getAll();
        setDivisions(divisionsResponse.data.divisions || divisionsResponse.data);

        // Fetch initial report data
        await fetchReportData();
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load report data. Please check your connection.',
          variant: 'destructive',
        });
        setData([]);
        setDivisions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const safeFormatDate = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return format(d, 'dd MMM yyyy');
  };

  const fetchReportData = async (filters?: { division?: string; start?: string; end?: string; filter?: Exclude<FilterKind, 'none'> }) => {
    try {
      const response = await reportApi.getReport(filters);
      const payload = response.data;

      // Handle server ranking mode
      if (payload && payload.mode === 'ranking' && Array.isArray(payload.ranking)) {
        setServerRanking(
          payload.filter === 'top_points'
            ? payload.ranking.map((r: any) => ({ name: r.name, value: r.points }))
            : payload.ranking.map((r: any) => ({ name: r.name, value: r.count }))
        );
        setData([]);
        return;
      } else {
        setServerRanking(null);
      }

      const reportData = payload.tasks || payload;

      const divMap: Record<string, string> = (divisions || []).reduce(
        (acc: Record<string, string>, d: any) => {
          const code = d.kode_divisi || d.kode || d.id || '';
          const name = d.nama_divisi || d.nama || '';
          if (code) acc[String(code)] = name;
          return acc;
        },
        {}
      );

      const transformedData: ReportItem[] = reportData.map((item: any) => {
        const code = typeof item.kode_divisi === 'string' ? item.kode_divisi : '';
        const divisionName = item.division_name || (code ? divMap[code] : undefined) || item.kode_divisi?.nama_divisi || 'Unknown';

        return {
          id: item._id || item.id,
          kode_pekerjaan: item.kode_pekerjaan,
          deskripsi: item.deskripsi,
          division: divisionName,
          picName: item.pic?.nama_pegawai || item.pic?.nama || (typeof item.pic === 'string' ? item.pic : null),
          status: item.status_pekerjaan,
          poin: item.poin ?? 0,
          deadline: item.deadline,
          tanggal_input: item.createdAt || item.tanggal_input || item.created || '',
          tanggal_selesai: item.tanggal_selesai || null,
        };
      });

      setData(transformedData);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      // Keep existing data or fallback
    }
  };

  const handleDivisionChange = (value: string) => {
    setDivisionFilter(value);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
  };

  const handleDateFieldTypeChange = (value: 'tanggal_input' | 'tanggal_selesai') => {
    setDateFieldType(value);
  };

  const handleSearch = async () => {
    const filters: { division?: string; start?: string; end?: string; filter?: Exclude<FilterKind, 'none'>; dateField?: 'tanggal_input' | 'tanggal_selesai' } = {};
    if (divisionFilter && divisionFilter !== 'all') filters.division = divisionFilter;
    if (startDate) filters.start = startDate;
    if (endDate) filters.end = endDate;
    if (filterType !== 'none') filters.filter = filterType;
    if (dateFieldType !== 'tanggal_input') filters.dateField = dateFieldType;
    await fetchReportData(filters);
  };

  // Ranking datasets for special filters
  const rankingByPoints = () => {
    if (serverRanking && filterType === 'top_points') {
      return serverRanking.map((r) => ({ name: r.name, points: r.value }));
    }
    const byPic: Record<string, number> = {};
    data.forEach((d) => {
      const key = d.picName || 'Unassigned';
      byPic[key] = (byPic[key] || 0) + (d.poin ?? 0);
    });
    return Object.entries(byPic)
      .map(([name, points]) => ({ name, points }))
      .sort((a, b) => b.points - a.points); // highest first
  };

  const rankingByTasks = () => {
    if (serverRanking && filterType === 'top_tasks') {
      return serverRanking.map((r) => ({ name: r.name, count: r.value }));
    }
    const byPic: Record<string, number> = {};
    data.forEach((d) => {
      const key = d.picName || 'Unassigned';
      byPic[key] = (byPic[key] || 0) + 1;
    });
    return Object.entries(byPic)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // highest first
  };

  const filteredData = data; // tasks dataset after server-side filters

  const buildRows = () => {
    if (filterType === 'top_points') {
      const rows = rankingByPoints().map((r) => [r.name, String(r.points)]);
      return rows;
    }
    if (filterType === 'top_tasks') {
      const rows = rankingByTasks().map((r) => [r.name, String(r.count)]);
      return rows;
    }
    return filteredData.map((d) => [
      d.kode_pekerjaan,
      d.deskripsi,
      d.division,
      d.picName || '-',
      formatStatus(d.status),
      String(d.poin ?? 0),
      safeFormatDate(dateFieldType === 'tanggal_selesai' ? d.tanggal_selesai : d.tanggal_input),
    ]);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const title = filterType === 'top_points'
      ? 'Top Points by Employee'
      : filterType === 'top_tasks'
      ? 'Most Tasks by Employee'
      : 'Tasks Report';
    const generated = `Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`;
    const appliedFilters: string[] = [];
    if (divisionFilter && divisionFilter !== 'all') appliedFilters.push(`Division: ${divisionFilter}`);
    if (startDate) appliedFilters.push(`From: ${startDate}`);
    if (endDate) appliedFilters.push(`To: ${endDate}`);
    if (filterType === 'top_points') appliedFilters.push('Filter: Top Points');
    if (filterType === 'top_tasks') appliedFilters.push('Filter: Most Tasks');
    const filtersLine = appliedFilters.length ? appliedFilters.join(' | ') : 'No additional filters';

    const marginX = 24; // tighter margins for more content width
    const startY = 76;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.text(title, marginX, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text(generated, marginX, 60);
    doc.text(filtersLine, marginX, 76);

    const head = filterType === 'none'
      ? [[
        'Code',
        'Description',
        'Division',
        'PIC',
        'Status',
        'Points',
        dateFieldType === 'tanggal_selesai' ? 'Completed' : 'Created',
      ]]
      : [[
        'Employee',
        filterType === 'top_points' ? 'Points' : 'Tasks',
      ]];

    autoTable(doc, {
      head,
      body: buildRows(),
      startY: startY + 12,
      theme: 'grid',
      margin: { left: marginX, right: marginX },
      styles: {
        fontSize: 9,
        cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.5,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [59, 130, 246], // blue-500
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left',
        lineColor: [30, 64, 175], // blue-800
        lineWidth: 0.5,
        fontSize: 10,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
      // Let autotable calculate widths to fit the page and wrap text
      tableWidth: 'auto',
      columnStyles: filterType === 'none' ? {
        0: { cellWidth: 'wrap' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'wrap' },
        3: { cellWidth: 'wrap' },
        4: { cellWidth: 'wrap' },
        5: { halign: 'right', cellWidth: 'wrap' },
        6: { cellWidth: 'wrap' },
      } : {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 'wrap' },
      },
      didParseCell: (dataArg) => {
        // Uppercase status for consistency
        if (filterType === 'none' && dataArg.section === 'body' && dataArg.column.index === 4 && typeof dataArg.cell.text[0] === 'string') {
          dataArg.cell.text[0] = (dataArg.cell.text[0] as string).toUpperCase();
        }
      },
    });

    const fileName = `tasks_report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
    doc.save(fileName);
  };

  const handleExportExcel = () => {
    const title = filterType === 'top_points'
      ? 'Top Points by Employee'
      : filterType === 'top_tasks'
      ? 'Most Tasks by Employee'
      : 'Tasks Report';
    const generated = `Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`;
    const appliedFilters: string[] = [];
    if (divisionFilter && divisionFilter !== 'all') appliedFilters.push(`Division: ${divisionFilter}`);
    if (startDate) appliedFilters.push(`From: ${startDate}`);
    if (endDate) appliedFilters.push(`To: ${endDate}`);
    if (filterType === 'top_points') appliedFilters.push('Filter: Top Points');
    if (filterType === 'top_tasks') appliedFilters.push('Filter: Most Tasks');
    const filtersLine = appliedFilters.length ? appliedFilters.join(' | ') : 'No additional filters';

    const header = filterType === 'none'
      ? ['Code', 'Description', 'Division', 'PIC', 'Status', 'Points', dateFieldType === 'tanggal_selesai' ? 'Completed' : 'Created']
      : ['Employee', filterType === 'top_points' ? 'Points' : 'Tasks'];
    const aoa: any[][] = [[title], [generated], [filtersLine], header, ...buildRows()];

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws['!merges'] = [
      XLSX.utils.decode_range(filterType === 'none' ? 'A1:G1' : 'A1:B1'),
      XLSX.utils.decode_range(filterType === 'none' ? 'A2:G2' : 'A2:B2'),
      XLSX.utils.decode_range(filterType === 'none' ? 'A3:G3' : 'A3:B3'),
    ];

    // Column widths
    ws['!cols'] = filterType === 'none' ? [
      { wch: 14 },
      { wch: 40 },
      { wch: 20 },
      { wch: 24 },
      { wch: 16 },
      { wch: 10 },
      { wch: 16 },
    ] : [
      { wch: 32 },
      { wch: 12 },
    ];

    // Title style
    const titleCell = ws['A1'];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 18 },
        alignment: { horizontal: 'left', vertical: 'center' },
      } as any;
    }
    const genCell = ws['A2'];
    if (genCell) {
      genCell.s = {
        font: { sz: 11, color: { rgb: '6B7280' } },
        alignment: { horizontal: 'left', vertical: 'center' },
      } as any;
    }
    const filtCell = ws['A3'];
    if (filtCell) {
      filtCell.s = {
        font: { sz: 11, color: { rgb: '6B7280' } },
        alignment: { horizontal: 'left', vertical: 'center' },
      } as any;
    }

    // Header styles
    const headerRow = 4; // row index starting at 1
    const headerCols = filterType === 'none' ? ['A','B','C','D','E','F','G'] : ['A','B'];
    headerCols.forEach((col) => {
      const cell = ws[`${col}${headerRow}`];
      if (cell) {
        cell.s = {
          fill: { fgColor: { rgb: '3B82F6' } },
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '1E40AF' } },
            bottom: { style: 'thin', color: { rgb: '1E40AF' } },
            left: { style: 'thin', color: { rgb: '1E40AF' } },
            right: { style: 'thin', color: { rgb: '1E40AF' } },
          },
        } as any;
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    const fileName = `tasks_report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const summary = filterType === 'none' ? {
    total: filteredData.length,
    open: filteredData.filter((d) => d.status === 'OPEN').length,
    onProgress: filteredData.filter((d) => d.status === 'ON PROGRESS').length,
    done: filteredData.filter((d) => d.status === 'DONE').length,
  } : {
    total: (serverRanking?.length ?? (filterType === 'top_points' ? rankingByPoints().length : rankingByTasks().length)),
    open: 0,
    onProgress: 0,
    done: 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-96 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Generate and export task reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="brand" className="rounded-full" onClick={handleExportExcel}>
            <FileText className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="brand" className="rounded-full" onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="p-6 bg-card rounded-2xl border border-border">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">Report Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Division</label>
            <Select value={divisionFilter} onValueChange={handleDivisionChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d._id || d.id || d.kode_divisi} value={d.kode_divisi || d.kode}>{d.nama_divisi || d.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Filter</label>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterKind)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak Ada</SelectItem>
                <SelectItem value="top_points">Poin Terbanyak</SelectItem>
                <SelectItem value="top_tasks">Task Terbanyak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-foreground block mb-2">Date Filter Type</label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateField"
                value="tanggal_input"
                checked={dateFieldType === 'tanggal_input'}
                onChange={(e) => handleDateFieldTypeChange(e.target.value as 'tanggal_input' | 'tanggal_selesai')}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm">Tanggal Input</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateField"
                value="tanggal_selesai"
                checked={dateFieldType === 'tanggal_selesai'}
                onChange={(e) => handleDateFieldTypeChange(e.target.value as 'tanggal_input' | 'tanggal_selesai')}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm">Tanggal Selesai</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="brand" className="rounded-full" onClick={handleSearch}>
            <FileText className="w-4 h-4 mr-2" />
            Cari Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-card rounded-2xl border border-border text-center">
          <p className="text-4xl font-bold text-foreground">{summary.total}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Tasks</p>
        </div>
        <div className="p-6 bg-card rounded-2xl border border-border text-center">
          <p className="text-4xl font-bold text-foreground">{summary.open}</p>
          <p className="text-sm text-muted-foreground mt-1">Open</p>
        </div>
        <div className="p-6 bg-card rounded-2xl border border-border text-center">
          <p className="text-4xl font-bold text-primary">{summary.onProgress}</p>
          <p className="text-sm text-muted-foreground mt-1">In Progress</p>
        </div>
        <div className="p-6 bg-card rounded-2xl border border-border text-center">
          <p className="text-4xl font-bold text-success">{summary.done}</p>
          <p className="text-sm text-muted-foreground mt-1">Done</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="p-6 bg-card rounded-2xl border border-border">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {filterType === 'top_points' ? 'Peringkat Poin Pegawai' : filterType === 'top_tasks' ? 'Peringkat Jumlah Task Pegawai' : 'Task Details'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {filterType === 'none' ? `Showing ${filteredData.length} tasks` : `Showing ${(serverRanking?.length ?? (filterType === 'top_points' ? rankingByPoints().length : rankingByTasks().length))} employees`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {filterType === 'none' ? (
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Task Code</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Description</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Division</TableHead>
                  <TableHead className="text-muted-foreground font-medium">PIC</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Points</TableHead>
                  <TableHead className="text-muted-foreground font-medium">{dateFieldType === 'tanggal_selesai' ? 'Completed' : 'Created'}</TableHead>
                </TableRow>
              ) : (
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Nama Pegawai</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right">{filterType === 'top_points' ? 'Poin' : 'Jumlah Task'}</TableHead>
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {filterType === 'none' ? (
                <>
                  {filteredData.map((item) => (
                    <TableRow key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground">{item.kode_pekerjaan}</TableCell>
                      <TableCell className="text-foreground">{item.deskripsi}</TableCell>
                      <TableCell className="text-foreground">{item.division}</TableCell>
                      <TableCell className="text-foreground">{item.picName || '-'}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className="text-foreground text-center">{item.poin}</TableCell>
                      <TableCell className="text-foreground">{safeFormatDate(dateFieldType === 'tanggal_selesai' ? item.tanggal_selesai : item.tanggal_input)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No tasks found.
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                <>
                  {(filterType === 'top_points' ? rankingByPoints() : rankingByTasks()).map((r) => (
                    <TableRow key={r.name} className="border-b border-border/50 hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                      <TableCell className="text-foreground text-right">{'points' in r ? r.points : (r as any).count}</TableCell>
                    </TableRow>
                  ))}
                  {((filterType === 'top_points' ? rankingByPoints() : rankingByTasks()).length === 0) && (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
