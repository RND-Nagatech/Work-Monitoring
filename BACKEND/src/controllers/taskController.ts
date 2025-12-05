import { Response } from 'express';
import Task from '../models/Task';
import Employee from '../models/Employee';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';

export const getAllTasks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const tasks = await Task.find({ status_pekerjaan: { $ne: 'DONE' } })
      .sort({ createdAt: -1 });
    successResponse(res, 'Tasks retrieved successfully', tasks);
  } catch (error: any) {
    errorResponse(res, 'Failed to retrieve tasks', error.message, 500);
  }
};

export const createTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Accept canonical and legacy payload keys
    const {
      kode_pekerjaan,
      kode_divisi: kodeCanonical,
      divisionId,
      deskripsi,
      poin,
      deadline,
      status,
    } = req.body as any;

    const kode_divisi = kodeCanonical ?? divisionId;

    if (!kode_pekerjaan || !kode_divisi || !deskripsi || !poin || !deadline) {
      errorResponse(
        res,
        'kode_pekerjaan, kode_divisi, deskripsi, poin, and deadline are required'
      );
      return;
    }

    const task = new Task({
      kode_pekerjaan,
      kode_divisi,
      deskripsi,
      status_pekerjaan: ['OPEN', 'ON PROGRESS', 'DONE'].includes(status) ? status : 'OPEN',
      poin,
      pic: null,
      deadline,
    });

    await task.save();

    const populatedTask = await Task.findById(task._id);

    successResponse(res, 'Task created successfully', populatedTask, 201);
  } catch (error: any) {
    errorResponse(res, 'Failed to create task', error.message, 500);
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      kode_pekerjaan,
      deskripsi,
      kode_divisi: kodeCanonical,
      divisionId,
      status_pekerjaan: statusCanonical,
      status,
      poin,
      deadline,
      pic,
    } = req.body as any;

    const updateData: any = {
      ...(kode_pekerjaan !== undefined && { kode_pekerjaan }),
      ...(deskripsi !== undefined && { deskripsi }),
      ...(poin !== undefined && { poin }),
      ...(deadline !== undefined && { deadline }),
      ...(pic !== undefined && { pic }),
    };

    const kode_divisi = kodeCanonical ?? divisionId;
    if (kode_divisi !== undefined) updateData.kode_divisi = kode_divisi;

    const nextStatus = statusCanonical ?? status;
    if (nextStatus !== undefined) {
      if (!['OPEN', 'ON PROGRESS', 'DONE'].includes(nextStatus)) {
        errorResponse(res, 'Invalid status', undefined, 400);
        return;
      }
      updateData.status_pekerjaan = nextStatus;
      // Set tanggal_selesai when status changes to DONE
      if (nextStatus === 'DONE') {
        updateData.tanggal_selesai = new Date().toISOString().split('T')[0];
      }
    }

    const task = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      errorResponse(res, 'Task not found', undefined, 404);
      return;
    }

    successResponse(res, 'Task updated successfully', task);
  } catch (error: any) {
    errorResponse(res, 'Failed to update task', error.message, 500);
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      errorResponse(res, 'Task not found', undefined, 404);
      return;
    }

    successResponse(res, 'Task deleted successfully');
  } catch (error: any) {
    errorResponse(res, 'Failed to delete task', error.message, 500);
  }
};

export const getAvailableTasks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.pegawai_id) {
      errorResponse(res, 'Employee ID not found', undefined, 400);
      return;
    }

    const employee = await Employee.findById(req.user.pegawai_id);
    if (!employee) {
      errorResponse(res, 'Employee not found', undefined, 404);
      return;
    }

    const tasks = await Task.find({
      $and: [
        { status_pekerjaan: { $ne: 'DONE' } },
        {
          $or: [{ pic: null }, { pic: employee.nama_pegawai }],
        }
      ]
    }).sort({ createdAt: -1 });

    successResponse(res, 'Available tasks retrieved successfully', tasks);
  } catch (error: any) {
    console.error('getAvailableTasks error:', error);
    errorResponse(res, 'Failed to retrieve available tasks', error.message, 500);
  }
};

export const takeTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.pegawai_id) {
      errorResponse(res, 'Employee ID not found', undefined, 400);
      return;
    }

    const task = await Task.findById(id);

    if (!task) {
      errorResponse(res, 'Task not found', undefined, 404);
      return;
    }

    if (task.pic !== null) {
      errorResponse(res, 'Task already taken by another employee', undefined, 400);
      return;
    }

    const employee = await Employee.findById(req.user.pegawai_id);
    if (!employee) {
      errorResponse(res, 'Employee not found', undefined, 404);
      return;
    }

    task.pic = employee.nama_pegawai;
    task.status_pekerjaan = 'ON PROGRESS';
    await task.save();

    const populatedTask = await Task.findById(task._id);

    successResponse(res, 'Task taken successfully', populatedTask);
  } catch (error: any) {
    console.error('takeTask error:', error);
    errorResponse(res, 'Failed to take task', error.message, 500);
  }
};

export const finishTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.pegawai_id) {
      errorResponse(res, 'Employee ID not found', undefined, 400);
      return;
    }

    const task = await Task.findById(id);

    if (!task) {
      errorResponse(res, 'Task not found', undefined, 404);
      return;
    }

    const employee = await Employee.findById(req.user.pegawai_id);
    if (!employee) {
      errorResponse(res, 'Employee not found', undefined, 404);
      return;
    }

    if (task.pic !== employee.nama_pegawai) {
      errorResponse(
        res,
        'You are not assigned to this task',
        undefined,
        403
      );
      return;
    }

    task.status_pekerjaan = 'DONE';
    task.tanggal_selesai = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    await task.save();

    const populatedTask = await Task.findById(task._id);

    successResponse(res, 'Task marked as done successfully', populatedTask);
  } catch (error: any) {
    console.error('finishTask error:', error);
    errorResponse(res, 'Failed to finish task', error.message, 500);
  }
};
