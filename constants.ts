import { NavItem, Feature, FeatureStatus } from './types';

export const APP_NAME = "React Starter";

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Features', href: '#features' },
  { label: 'Docs', href: '#docs' },
  { label: 'GitHub', href: '#github' },
];

export const FEATURES: Feature[] = [
  {
    id: '1',
    title: 'TypeScript Ready',
    description: 'Fully typed codebase for better developer experience and fewer bugs.',
    status: FeatureStatus.ACTIVE,
    icon: '⚡'
  },
  {
    id: '2',
    title: 'Tailwind CSS',
    description: 'Utility-first CSS framework for rapid UI development and easy customization.',
    status: FeatureStatus.ACTIVE,
    icon: '🎨'
  },
  {
    id: '3',
    title: 'Modular Structure',
    description: 'Organized file structure separating components, services, and types.',
    status: FeatureStatus.ACTIVE,
    icon: '🧩'
  }
];