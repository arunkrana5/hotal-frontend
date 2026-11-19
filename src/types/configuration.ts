export interface NavigationMenuDto {
  id: number;
  code: string;
  title: string;
  path: string;
  icon?: string;
  displayOrder: number;
  module: string;
  badgeText?: string;
  children: NavigationMenuDto[];
}

export interface DynamicFormFieldDto {
  id: number;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string; // TEXT, NUMBER, DECIMAL, DATE, DATETIME, TIME, SELECT, MULTISELECT, CHECKBOX, TEXTAREA
  isMandatory: boolean;
  displayOrder: number;
  masterDefinitionCode?: string;
  defaultValue?: string;
  placeholder?: string;
  sectionName?: string;
}

export interface DynamicFormDto {
  id: number;
  code: string;
  title: string;
  description: string;
  module: string;
  entityType: string;
  version: number;
  fields: DynamicFormFieldDto[];
}
