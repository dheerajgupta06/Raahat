import mongoose from 'mongoose';

const rejectedRegistrationSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    hospitalName: { type: String, required: true, trim: true, maxlength: 140 },
    city: { type: String, trim: true, maxlength: 80, default: '' },
    state: { type: String, trim: true, maxlength: 80, default: '' },
    type: { type: String, trim: true, maxlength: 40, default: '' },
    applicantName: { type: String, trim: true, maxlength: 80, default: '' },
    applicantEmail: { type: String, trim: true, lowercase: true, maxlength: 160, default: '' },
    documentName: { type: String, trim: true, maxlength: 240, default: '' },
    reason: { type: String, required: true, trim: true, maxlength: 400 },
    rejectedBy: { type: String, trim: true, maxlength: 80, default: '' },
    rejectedById: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    rejectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

rejectedRegistrationSchema.index({ rejectedAt: -1 });

rejectedRegistrationSchema.methods.toJSONPayload = function toJSONPayload() {
  return {
    id: this._id.toString(),
    hospitalId: this.hospital.toString(),
    hospitalName: this.hospitalName,
    city: this.city,
    state: this.state,
    type: this.type,
    applicant: { name: this.applicantName, email: this.applicantEmail },
    documentName: this.documentName,
    reason: this.reason,
    rejectedBy: this.rejectedBy,
    rejectedAt: this.rejectedAt.toISOString(),
  };
};

export default mongoose.model('RejectedRegistration', rejectedRegistrationSchema);
