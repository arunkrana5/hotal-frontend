export interface WorkflowStepDto {
  id: number;
  stepOrder: number;
  stepName: string;
  stepType: string;
  assignedRole?: string;
  slaMinutes: number;
}

export interface WorkflowDefinitionDto {
  id: number;
  code: string;
  title: string;
  module: string;
  version: number;
  description: string;
  steps: WorkflowStepDto[];
}

export interface WorkflowTransitionRequest {
  instanceId: number;
  actionName: string;
  comments?: string;
}

export interface WorkflowHistoryDto {
  id: number;
  stepName: string;
  actionTaken: string;
  actionByUserId: number;
  actionAt: string;
  comments?: string;
  previousStatus: string;
  newStatus: string;
}

export interface WorkflowInstanceDto {
  id: number;
  workflowDefinitionId: number;
  workflowTitle: string;
  entityType: string;
  entityId: number;
  currentStepId: number;
  currentStepName: string;
  status: string;
  initiatedByUserId: number;
  initiatedAt: string;
  history: WorkflowHistoryDto[];
  availableActions: string[];
}
