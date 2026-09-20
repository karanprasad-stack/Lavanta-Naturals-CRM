import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'FOUNDER' | 'HR' | 'MANAGER' | 'EMPLOYEE' | 'INTERN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  profilePhoto?: string;
  role: UserRole;
  department: string;
  designation: string;
  joiningDate: string;
  phone?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    profilePhoto: { type: String, default: '' },
    role: {
      type: String,
      enum: ['FOUNDER', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN'],
      required: true,
      default: 'EMPLOYEE'
    },
    department: { type: String, required: true, default: 'General' },
    designation: { type: String, required: true, default: 'Staff' },
    joiningDate: { type: String, required: true },
    phone: { type: String, default: '' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete (ret as any).passwordHash;
        return ret;
      }
    }
  }
);

// Query performance indexes
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ joiningDate: -1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
