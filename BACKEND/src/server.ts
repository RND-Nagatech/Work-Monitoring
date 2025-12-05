import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/database';
import Task from './models/Task';
import Division from './models/Division';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    // PIC cleanup removed: PIC is now intentionally stored as employee name (string)

    // Migration: convert task.kode_divisi from ObjectId to division code string
    try {
      const tasksNeedingMigration = await Task.find({});
      let migrated = 0;
      for (const t of tasksNeedingMigration) {
        if (t && typeof t.kode_divisi !== 'string') {
          const div = await Division.findById(t.kode_divisi as any);
          if (div) {
            (t as any).kode_divisi = div.kode_divisi;
            await t.save();
            migrated++;
          }
        }
      }
      if (migrated) {
        console.log(`Migrated ${migrated} task(s) kode_divisi to string codes.`);
      }
    } catch (migErr) {
      console.warn('Task kode_divisi migration skipped:', migErr);
    }

    // Migration: convert tanggal_input from Date to YYYY-MM-DD string
    try {
      const tasksWithDateInput = await Task.find({ tanggal_input: { $type: 'date' } });
      let dateMigrated = 0;
      for (const t of tasksWithDateInput) {
        if (t.tanggal_input instanceof Date) {
          (t as any).tanggal_input = t.tanggal_input.toISOString().split('T')[0];
          await t.save();
          dateMigrated++;
        }
      }
      if (dateMigrated) {
        console.log(`Migrated ${dateMigrated} task(s) tanggal_input to YYYY-MM-DD string format.`);
      }
    } catch (dateMigErr) {
      console.warn('Task tanggal_input migration skipped:', dateMigErr);
    }

    // Hardcode default admin user
    const { default: User } = await import('./models/User');
    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      await User.create({
        username: 'admin',
        password: 'admin123', // Akan di-hash otomatis
        role: 'admin',
      });
      console.log('Default admin created: admin / admin123');
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
