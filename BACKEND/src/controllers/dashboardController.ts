import { Response } from 'express';
import Task from '../models/Task';
import Division from '../models/Division';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';

export const getAdminDashboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [tasks, divisions] = await Promise.all([
      Task.find().sort({ createdAt: -1 }),
      Division.find({}, 'kode_divisi nama_divisi'),
    ]);

    const divisionMap = new Map<string, string>();
    divisions.forEach((d: any) => divisionMap.set(d.kode_divisi, d.nama_divisi));

    const groupedByDivision: any = {};
    const onProgressTasks: any[] = [];

    tasks.forEach((task: any) => {
      const divisionName = divisionMap.get(task.kode_divisi) || task.kode_divisi || 'Unknown';

      if (!groupedByDivision[divisionName]) {
        groupedByDivision[divisionName] = {
          division: divisionName,
          tasks: [],
        };
      }

      groupedByDivision[divisionName].tasks.push(task);

      if (task.status_pekerjaan === 'ON PROGRESS') {
        onProgressTasks.push(task);
      }
    });

    const dashboardData = {
      totalTasks: tasks.length,
      tasksByStatus: {
        OPEN: tasks.filter((t: any) => t.status_pekerjaan === 'OPEN').length,
        'ON PROGRESS': tasks.filter((t: any) => t.status_pekerjaan === 'ON PROGRESS').length,
        DONE: tasks.filter((t: any) => t.status_pekerjaan === 'DONE').length,
      },
      tasksByDivision: Object.values(groupedByDivision),
      onProgressTasks,
    };

    successResponse(res, 'Admin dashboard retrieved successfully', dashboardData);
  } catch (error: any) {
    errorResponse(res, 'Failed to retrieve admin dashboard', error.message, 500);
  }
};

export const getEmployeeDashboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.pegawai_id) {
      errorResponse(res, 'Employee ID not found', undefined, 400);
      return;
    }

    const [tasks, divisions] = await Promise.all([
      Task.find({ pic: (await (await import('../models/Employee')).default.findById(req.user.pegawai_id))?.nama_pegawai || '__NOEMP__' }).sort({ createdAt: -1 }),
      Division.find({}, 'kode_divisi nama_divisi'),
    ]);

    const divisionMap = new Map<string, string>();
    divisions.forEach((d: any) => divisionMap.set(d.kode_divisi, d.nama_divisi));

    const dashboardData = {
      totalTasks: tasks.length,
      tasksByStatus: {
        OPEN: tasks.filter((t: any) => t.status_pekerjaan === 'OPEN').length,
        'ON PROGRESS': tasks.filter((t: any) => t.status_pekerjaan === 'ON PROGRESS').length,
        DONE: tasks.filter((t: any) => t.status_pekerjaan === 'DONE').length,
      },
      totalPoints: tasks.reduce((sum, task) => sum + task.poin, 0),
      tasks: tasks.map((t: any) => ({
        ...t.toObject(),
        division_name: divisionMap.get(t.kode_divisi) || t.kode_divisi || 'Unknown',
      })),
    };

    successResponse(res, 'Employee dashboard retrieved successfully', dashboardData);
  } catch (error: any) {
    console.error('getEmployeeDashboard error:', error);
    errorResponse(res, 'Failed to retrieve employee dashboard', error.message, 500);
  }
};
