
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Request,
  RequestDocument,
  RequestStatus,
} from '../requests/schemas/request.schema';

import {
  User,
  UserDocument,
  UserRole,
} from '../users/schemas/user.schema';

import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Request.name)
    private readonly requestModel: Model<RequestDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  // ADMIN DASHBOARD
  async getAdminDashboard() {
    const [
      totalRequests,
      openRequests,
      assignedRequests,
      inProgressRequests,
      resolvedRequests,
      closedRequests,
      totalEmployees,
      totalAgents,
      activeAgents,
      activeCategories,
      recentRequests,
    ] = await Promise.all([
      this.requestModel.countDocuments(),

      this.requestModel.countDocuments({
        status: RequestStatus.OPEN,
      }),

      this.requestModel.countDocuments({
        status: RequestStatus.ASSIGNED,
      }),

      this.requestModel.countDocuments({
        status: RequestStatus.IN_PROGRESS,
      }),

      this.requestModel.countDocuments({
        status: RequestStatus.RESOLVED,
      }),

      this.requestModel.countDocuments({
        status: RequestStatus.CLOSED,
      }),

      this.userModel.countDocuments({
        role: UserRole.EMPLOYEE,
      }),

      this.userModel.countDocuments({
        role: UserRole.AGENT,
      }),

      this.userModel.countDocuments({
        role: UserRole.AGENT,
        isActive: true,
      }),

      this.categoryModel.countDocuments({
        isActive: true,
      }),

      this.requestModel
        .find()
        .populate('category', 'name')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      summary: {
        totalRequests,
        openRequests,
        assignedRequests,
        inProgressRequests,
        resolvedRequests,
        closedRequests,
        totalEmployees,
        totalAgents,
        activeAgents,
        activeCategories,
      },
      recentRequests,
    };
  }

  // EMPLOYEE DASHBOARD
  async getEmployeeDashboard(userId: string) {
    const employeeId = new Types.ObjectId(userId);
    const filter = { createdBy: employeeId };

    const [
      totalRequests,
      openRequests,
      assignedRequests,
      inProgressRequests,
      resolvedRequests,
      closedRequests,
      recentRequests,
    ] = await Promise.all([
      this.requestModel.countDocuments(filter),

      this.requestModel.countDocuments({
        ...filter,
        status: RequestStatus.OPEN,
      }),

      this.requestModel.countDocuments({
        ...filter,
        status: RequestStatus.ASSIGNED,
      }),

      this.requestModel.countDocuments({
        ...filter,
        status: RequestStatus.IN_PROGRESS,
      }),

      this.requestModel.countDocuments({
        ...filter,
        status: RequestStatus.RESOLVED,
      }),

      this.requestModel.countDocuments({
        ...filter,
        status: RequestStatus.CLOSED,
      }),

      this.requestModel
        .find(filter)
        .populate('category', 'name description')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      summary: {
        totalRequests,
        openRequests,
        assignedRequests,
        inProgressRequests,
        resolvedRequests,
        closedRequests,
      },
      recentRequests,
    };
  }

  // AGENT DASHBOARD
  async getAgentDashboard(userId: string) {
    const agentId = new Types.ObjectId(userId);
    const filter = { assignedTo: agentId };

    const [
      totalAssignedRequests,
      assignedRequests,
      inProgressRequests,
      resolvedRequests,
      closedRequests,
      recentRequests,
    ] = await Promise.all([
      this.requestModel.countDocuments(filter),

      this.requestModel.countDocuments({
        ...filter,
        status: RequestStatus.ASSIGNED,
      }),

      this.requestModel.countDocuments({
        ...filter,
        status: RequestStatus.IN_PROGRESS,
      }),

      this.requestModel.countDocuments({
        ...filter,
        status: RequestStatus.RESOLVED,
      }),

      this.requestModel.countDocuments({
        ...filter,
        status: RequestStatus.CLOSED,
      }),

      this.requestModel
        .find(filter)
        .populate('category', 'name description')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      summary: {
        totalAssignedRequests,
        assignedRequests,
        inProgressRequests,
        resolvedRequests,
        closedRequests,
      },
      recentRequests,
    };
  }
}
