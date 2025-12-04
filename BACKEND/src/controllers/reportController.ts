import { Request, Response } from 'express';
import Task from '../models/Task';
import Division from '../models/Division';
import { successResponse, errorResponse } from '../utils/response';

export const getReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { divisi, division, start, end, filter: filterMode } = req.query as Record<string, string>;

    const queryFilter: any = {};

    const divisionCode = division ?? divisi;
    if (divisionCode) {
      queryFilter.kode_divisi = divisionCode;
    }

    if (start || end) {
      queryFilter.tanggal_input = {};
      if (start) {
        queryFilter.tanggal_input.$gte = new Date(start as string);
      }
      if (end) {
        queryFilter.tanggal_input.$lte = new Date(end as string);
      }
    }

    const [tasks, divisions] = await Promise.all([
      Task.find(queryFilter).sort({ tanggal_input: -1 }),
      Division.find({}),
    ]);

    const divMap: Record<string, string> = divisions.reduce((acc: Record<string, string>, d: any) => {
      if (d.kode_divisi) acc[String(d.kode_divisi)] = d.nama_divisi || d.nama || d.kode_divisi;
      return acc;
    }, {});

    const reportData = tasks.map((task: any) => ({
      _id: task._id,
      kode_pekerjaan: task.kode_pekerjaan,
      division_name: divMap[String(task.kode_divisi)] || 'Unknown',
      deskripsi: task.deskripsi,
      poin: task.poin,
      pic: typeof task.pic === 'string' ? task.pic : null,
      status_pekerjaan: task.status_pekerjaan,
      tanggal_input: task.tanggal_input,
      deadline: task.deadline,
    }));

    const summary = {
      totalTasks: tasks.length,
      totalPoints: tasks.reduce((sum, task) => sum + task.poin, 0),
      byStatus: {
        OPEN: tasks.filter((t: any) => t.status_pekerjaan === 'OPEN').length,
        'ON PROGRESS': tasks.filter((t: any) => t.status_pekerjaan === 'ON PROGRESS').length,
        DONE: tasks.filter((t: any) => t.status_pekerjaan === 'DONE').length,
      },
    };

    // Optional ranking mode
    if (filterMode === 'top_points') {
      const byPic: Record<string, number> = {};
      for (const r of reportData) {
        const key = r.pic || 'Unassigned';
        byPic[key] = (byPic[key] || 0) + (r.poin ?? 0);
      }
      const ranking = Object.entries(byPic)
        .map(([name, points]) => ({ name, points }))
        .sort((a, b) => b.points - a.points);

      successResponse(res, 'Report ranking generated successfully', {
        mode: 'ranking',
        filter: 'top_points',
        summary,
        ranking,
      });
      return;
    }

    if (filterMode === 'top_tasks') {
      const byPic: Record<string, number> = {};
      for (const r of reportData) {
        const key = r.pic || 'Unassigned';
        byPic[key] = (byPic[key] || 0) + 1;
      }
      const ranking = Object.entries(byPic)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      successResponse(res, 'Report ranking generated successfully', {
        mode: 'ranking',
        filter: 'top_tasks',
        summary,
        ranking,
      });
      return;
    }

    successResponse(res, 'Report generated successfully', {
      summary,
      tasks: reportData,
    });
  } catch (error: any) {
    errorResponse(res, 'Failed to generate report', error.message, 500);
  }
};
