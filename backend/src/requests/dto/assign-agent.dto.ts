import { IsMongoId } from 'class-validator';

export class AssignAgentDto {
  @IsMongoId()
  agentId: string;
}