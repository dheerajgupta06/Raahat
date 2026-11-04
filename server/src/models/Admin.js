import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },
    passwordHash: { type: String, required: true, select: false },
    // Official designation only. Receptionist personal numbers are never exposed publicly.
    designation: { type: String, trim: true, maxlength: 80, default: 'Hospital administrator' },
    phone: { type: String, trim: true, default: '' },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    role: { type: String, enum: ['hospital_admin', 'super_admin'], default: 'hospital_admin' },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

adminSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash.startsWith('$2')) return next();
  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

adminSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    designation: this.designation,
    role: this.role,
    hospitalId: this.hospital ? this.hospital.toString() : null,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('Admin', adminSchema);
