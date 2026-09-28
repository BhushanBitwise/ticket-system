import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';

import { Request, RequestDocument, RequestPriority, RequestStatus } from './schemas/request.schema';
import { CreateRequestDto } from './dto/create-request.dto';

import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(Request.name)
    private readonly requestModel: Model<RequestDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    private readonly usersService: UsersService,
  ) {}

  private validateId(id: string, label = 'ID'): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }

  private async getRequestOrFail(
    id: string,
  ): Promise<RequestDocument> {
    this.validateId(id, 'request ID');

    const request = await this.requestModel.findById(id);

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  private assertCreator(
    request: RequestDocument,
    userId: string,
  ): void {
    if (request.createdBy.toString() !== userId) {
      throw new ForbiddenException(
        'You can only manage your own requests',
      );
    }
  }

  private assertAssignedAgent(
    request: RequestDocument,
    userId: string,
  ): void {
    if (
      !request.assignedTo ||
      request.assignedTo.toString() !== userId
    ) {
      throw new ForbiddenException(
        'This request is not assigned to you',
      );
    }
  }

  private generateRequestId(): string {
    const year = new Date().getFullYear();
    const suffix = randomBytes(4).toString('hex').toUpperCase();

    return `REQ-${year}-${suffix}`;
  }

  // EMPLOYEE: Create a request
  async create(
    dto: CreateRequestDto,
    userId: string,
  ) {
    this.validateId(dto.categoryId, 'category ID');

    const category = await this.categoryModel.findById(
      dto.categoryId,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.isActive) {
      throw new BadRequestException(
        'Selected category is inactive',
      );
    }

    const request = await this.requestModel.create({
      requestId: this.generateRequestId(),
      title: dto.title.trim(),
      description: dto.description.trim(),
      category: category._id,
      priority: dto.priority ?? RequestPriority.MEDIUM,
      status: RequestStatus.OPEN,
      createdBy: new Types.ObjectId(userId),
      assignedTo: null,
      resolutionNote: null,
    });

    return {
      message: 'Request created successfully',
      request: await this.getPopulatedRequest(
        request._id.toString(),
      ),
    };
  }

 
  // EMPLOYEE: View own requests
  async findMyRequests(userId: string) {
    this.validateId(userId, 'employee ID');

    const employeeObjectId = new Types.ObjectId(userId);

    const requests = await this.requestModel
      .find({ createdBy: employeeObjectId })
      .populate('category', 'name description')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    console.log('[findMyRequests] Employee ID:', employeeObjectId.toString());
    console.log('[findMyRequests] Requests found:', requests.length);

    return { requests };
  }


  // ADMIN: View all requests
  async findAll() {
    const requests = await this.requestModel
      .find()
      .populate('category', 'name description')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return { requests };
  }

// ** AGENT: View requests assigned to them
//   async findAssignedRequests(userId: string) {
//     const requests = await this.requestModel
//       .find({ assignedTo: userId })
//       .populate('category', 'name description')
//       .populate('createdBy', 'name email')
//       .sort({ createdAt: -1 })
//       .lean();

//     return { requests };
//   }
// AGENT: View requests assigned to them
async findAssignedRequests(userId: string) {
  this.validateId(userId, 'agent ID');

  const agentObjectId = new Types.ObjectId(userId);

  const requests = await this.requestModel
    .find({ assignedTo: agentObjectId })
    .populate('category', 'name description')
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return { requests };
}

  // ADMIN / owning EMPLOYEE / assigned AGENT: View one request
  async findOne(
    id: string,
    user: { id: string; role: UserRole },
  ) {
    const request = await this.getRequestOrFail(id);

    if (user.role === UserRole.EMPLOYEE) {
      this.assertCreator(request, user.id);
    }

    if (user.role === UserRole.AGENT) {
      this.assertAssignedAgent(request, user.id);
    }

    return {
      request: await this.getPopulatedRequest(id),
    };
  }

  // ADMIN: Assign or reassign an agent
  async assignAgent(
    id: string,
    agentId: string,
  ) {
    this.validateId(agentId, 'agent ID');

    const request = await this.getRequestOrFail(id);
    const agent = await this.usersService.findAgentById(agentId);

    if (!agent.isActive) {
      throw new BadRequestException(
        'Cannot assign a request to an inactive agent',
      );
    }

    if (
      request.status !== RequestStatus.OPEN &&
      request.status !== RequestStatus.ASSIGNED
    ) {
      throw new BadRequestException(
        'Only OPEN or ASSIGNED requests can be assigned',
      );
    }

    request.assignedTo = agent._id as Types.ObjectId;
    request.status = RequestStatus.ASSIGNED;
    request.assignedAt = new Date();

    await request.save();

    return {
      message: 'Agent assigned successfully',
      request: await this.getPopulatedRequest(id),
    };
  }

  // AGENT: Start working
  async startWork(
    id: string,
    userId: string,
  ) {
    const request = await this.getRequestOrFail(id);

    this.assertAssignedAgent(request, userId);

    if (request.status !== RequestStatus.ASSIGNED) {
      throw new BadRequestException(
        'Only ASSIGNED requests can be started',
      );
    }

    request.status = RequestStatus.IN_PROGRESS;
    await request.save();

    return {
      message: 'Request moved to IN_PROGRESS',
      request: await this.getPopulatedRequest(id),
    };
  }

  // AGENT: Resolve request
  async resolve(
    id: string,
    userId: string,
    resolutionNote: string,
  ) {
    const request = await this.getRequestOrFail(id);

    this.assertAssignedAgent(request, userId);

    if (request.status !== RequestStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Only IN_PROGRESS requests can be resolved',
      );
    }

    request.status = RequestStatus.RESOLVED;
    request.resolutionNote = resolutionNote.trim();
    request.resolvedAt = new Date();

    await request.save();

    return {
      message: 'Request resolved successfully',
      request: await this.getPopulatedRequest(id),
    };
  }

  // EMPLOYEE: Confirm that the issue is fixed
  async close(
    id: string,
    userId: string,
  ) {
    const request = await this.getRequestOrFail(id);

    this.assertCreator(request, userId);

    if (request.status !== RequestStatus.RESOLVED) {
      throw new BadRequestException(
        'Only RESOLVED requests can be closed',
      );
    }

    request.status = RequestStatus.CLOSED;
    request.closedAt = new Date();

    await request.save();

    return {
      message: 'Request closed successfully',
      request: await this.getPopulatedRequest(id),
    };
  }

  // EMPLOYEE: Issue is not fixed; reopen for further work
  async reopen(
    id: string,
    userId: string,
  ) {
    const request = await this.getRequestOrFail(id);

    this.assertCreator(request, userId);

    if (request.status !== RequestStatus.RESOLVED) {
      throw new BadRequestException(
        'Only RESOLVED requests can be reopened',
      );
    }

    if (!request.assignedTo) {
      throw new BadRequestException(
        'Request has no assigned agent',
      );
    }

    request.status = RequestStatus.IN_PROGRESS;
    request.reopenedAt = new Date();
    request.resolvedAt = null;
    request.closedAt = null;

    await request.save();

    return {
      message: 'Request reopened and moved to IN_PROGRESS',
      request: await this.getPopulatedRequest(id),
    };
  }

  private async getPopulatedRequest(id: string) {
    const request = await this.requestModel
      .findById(id)
      .populate('category', 'name description')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }
}