import type { Role, MenuItem } from './types';

export const initialRoles: Role[] = [
  { id: 'admin', name: 'Administrator', description: 'Has access to all menu options and settings.' },
  { id: 'editor', name: 'Content Editor', description: 'Can create and edit content-related pages.' },
  { id: 'viewer', name: 'Viewer', description: 'Can only view public-facing pages.' },
  { id: 'support', name: 'Support Agent', description: 'Access to support tools and customer data.' },
];

export const initialMenuItems: MenuItem[] = [
  {
    id: '1',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    roles: ['admin', 'editor', 'support'],
  },
  {
    id: '2',
    label: 'Content',
    icon: 'FileText',
    path: '/content',
    roles: ['admin', 'editor'],
    children: [
      { id: '2-1', label: 'Articles', icon: 'Newspaper', path: '/content/articles', roles: ['admin', 'editor'] },
      { id: '2-2', label: 'Media Library', icon: 'Image', path: '/content/media', roles: ['admin', 'editor'] },
    ],
  },
  {
    id: '3',
    label: 'Analytics',
    icon: 'BarChart2',
    path: '/analytics',
    roles: ['admin'],
  },
  {
    id: '4',
    label: 'Customers',
    icon: 'Users',
    path: '/customers',
    roles: ['admin', 'support'],
  },
  {
    id: '5',
    label: 'Settings',
    icon: 'Settings',
    path: '/settings',
    roles: ['admin'],
    children: [
        { id: '5-1', label: 'Profile', icon: 'User', path: '/settings/profile', roles: ['admin', 'editor', 'support', 'viewer'] },
        { id: '5-2', label: 'Billing', icon: 'CreditCard', path: '/settings/billing', roles: ['admin'] },
    ]
  },
];
