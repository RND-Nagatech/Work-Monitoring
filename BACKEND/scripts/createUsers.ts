import mongoose from 'mongoose';
import User from '../src/models/User';
import Employee from '../src/models/Employee';
import Division from '../src/models/Division';

const MONGO_URI = 'mongodb+srv://robbynugraha:Pr5DG8aQntBxXkHA@cluster0.qxxyqlg.mongodb.net/db_monitoringwork?retryWrites=true&w=majority&appName=Cluster0';

async function createUsers() {
  await mongoose.connect(MONGO_URI);

  const upsertUser = async (
    username: string,
    password: string,
    role: 'admin' | 'manager' | 'employee'
  ) => {
    const existing = await User.findOne({ username });
    if (existing) {
      existing.password = password; // plain password; will be hashed by pre-save hook
      existing.role = role;
      await existing.save();
      console.log(`Updated user: ${username}`);
    } else {
      await User.create({ username, password, role }); // pre-save will hash
      console.log(`Created user: ${username}`);
    }
  };

  await upsertUser('manager', 'manager123', 'manager');

  // Ensure an Employee exists and link to the 'employee' user
  let employee = await Employee.findOne({ kode_pegawai: '0001' });
  if (!employee) {
    let division = await Division.findOne();
    if (!division) {
      division = await Division.create({ kode_divisi: 'IT', nama_divisi: 'IT Division' });
      console.log('Created default division IT');
    }
    employee = await Employee.create({
      kode_pegawai: '0001',
      nama_pegawai: 'Employee 0001',
      kode_divisi: division._id as any,
    });
    console.log('Created default employee 0001');
  }

  const employeeUser = await User.findOne({ username: 'employee' });
  if (employeeUser) {
    employeeUser.pegawai_id = employee._id as any;
    await employeeUser.save();
    console.log('Linked employee user to pegawai_id:', employee._id.toString());
  } else {
    const created = await User.create({
      username: 'employee',
      password: 'employee123',
      role: 'employee',
      pegawai_id: employee._id as any,
    });
    console.log('Created and linked employee user:', created._id.toString());
  }

  console.log('Manager and Employee ensured!');
  await mongoose.disconnect();
}

createUsers().catch(console.error);
