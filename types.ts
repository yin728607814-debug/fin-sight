export interface NavItem {
  label: string;
  href: string;
}

export enum FeatureStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  icon: string;
}