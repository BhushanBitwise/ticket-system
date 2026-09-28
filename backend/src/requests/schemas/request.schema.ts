import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RequestDocument = HydratedDocument<Request>;

export enum RequestStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Schema({ timestamps: true })
export class Request {
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  requestId: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 150,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 3000,
  })
  description: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Types.ObjectId;

  @Prop({
    type: String,
    enum: RequestPriority,
    default: RequestPriority.MEDIUM,
    required: true,
  })
  priority: RequestPriority;

  @Prop({
    type: String,
    enum: RequestStatus,
    default: RequestStatus.OPEN,
    required: true,
  })
  status: RequestStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  assignedTo: Types.ObjectId | null;

@Prop({ type: String, default: null })
resolutionNote: string | null;

@Prop({ type: Date, default: null })
assignedAt: Date | null;

@Prop({ type: Date, default: null })
resolvedAt: Date | null;

@Prop({ type: Date, default: null })
closedAt: Date | null;

@Prop({ type: Date, default: null })
reopenedAt: Date | null;
}

export const RequestSchema = SchemaFactory.createForClass(Request);