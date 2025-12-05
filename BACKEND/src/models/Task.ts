import mongoose, { Schema } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>(
  {
    kode_pekerjaan: {
      type: String,
      required: true,
      trim: true,
    },
    kode_divisi: {
      type: String,
      required: true,
      trim: true,
    },
    deskripsi: {
      type: String,
      required: true,
    },
    status_pekerjaan: {
      type: String,
      enum: ['OPEN', 'ON PROGRESS', 'DONE'],
      default: 'OPEN',
      required: true,
    },
    poin: {
      type: Number,
      required: true,
      min: 0,
    },
    // Store employee name directly instead of ObjectId
    pic: {
      type: String,
      default: null,
      trim: true,
    },
    tanggal_input: {
      type: String,
      default: () => new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    },
    tanggal_selesai: {
      type: String,
      default: null, // YYYY-MM-DD format when task is completed
    },
    deadline: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITask>('Task', taskSchema,'tt_task');
