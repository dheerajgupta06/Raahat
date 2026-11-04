import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'registration_submitted',
  'registration_approved',
  'registration_rejected',
  'contacts_verified',
];

const notificationSchema = new mongoose.Schema(
  {
    audience: { type: String, enum: ['admin'], default: 'admin' },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 400 },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    hospitalName: { type: String, trim: true, maxlength: 140, default: '' },
    actor: { type: String, trim: true, maxlength: 80, default: '' },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }],
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, createdAt: -1 });

notificationSchema.methods.toJSONPayload = function toJSONPayload(adminId) {
  return {
    id: this._id.toString(),
    type: this.type,
    title: this.title,
    message: this.message,
    hospitalId: this.hospital ? this.hospital.toString() : null,
    hospitalName: this.hospitalName,
    actor: this.actor,
    read: adminId ? this.readBy.some((id) => id.toString() === adminId.toString()) : false,
    createdAt: this.createdAt.toISOString(),
  };
};

export default mongoose.model('Notification', notificationSchema);
