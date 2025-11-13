export type Role = {
  id: string;
  name: string;
  description: string;
};

export type MenuItem = {
  id: string;
  label: string;
  icon: string; // Name of a lucide-react icon
  path: string;
  roles: string[]; // array of role IDs
  children?: MenuItem[];
};
