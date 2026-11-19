export interface DropdownOptionDto {
  id: number;
  code: string;
  name: string;
  description: string;
  numericValue?: number;
  parentValueId?: number;
  isDefault: boolean;
}

export interface MasterDefinitionDto {
  id: number;
  code: string;
  name: string;
  categoryCode: string;
  description: string;
  isPropertySpecific: boolean;
  isHierarchical: boolean;
  displayOrder: number;
}

export interface MasterValueDto {
  id: number;
  masterDefinitionId: number;
  definitionCode: string;
  propertyId?: number;
  parentValueId?: number;
  code: string;
  name: string;
  description: string;
  numericValue?: number;
  extraDataJson?: string;
  displayOrder: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface CreateMasterValueRequest {
  masterDefinitionId: number;
  code: string;
  name: string;
  description: string;
  propertyId?: number;
  parentValueId?: number;
  numericValue?: number;
  extraDataJson?: string;
  displayOrder?: number;
  isDefault?: boolean;
}

export interface UpdateMasterValueRequest {
  name: string;
  description: string;
  parentValueId?: number;
  numericValue?: number;
  extraDataJson?: string;
  displayOrder?: number;
  isActive: boolean;
  isDefault?: boolean;
}
