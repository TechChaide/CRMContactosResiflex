'use client';

import type { Dispatch, SetStateAction } from 'react';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Role } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface RoleManagerProps {
  roles: Role[];
  setRoles: Dispatch<SetStateAction<Role[]>>;
}

export function RoleManager({ roles, setRoles }: RoleManagerProps) {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [currentRole, setCurrentRole] = React.useState<Role | null>(null);

    const handleSaveRole = (formData: FormData) => {
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        if (id) {
            setRoles(roles.map(r => r.id === id ? { ...r, name, description } : r));
        } else {
            const newId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            setRoles([...roles, { id: newId, name, description }]);
        }
        setIsDialogOpen(false);
        setCurrentRole(null);
    };

    const handleDeleteRole = (roleId: string) => {
        setRoles(roles.filter(r => r.id !== roleId));
    };

    const openDialog = (role: Role | null) => {
        setCurrentRole(role);
        setIsDialogOpen(true);
    };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <CardTitle>Role Management</CardTitle>
                <CardDescription>Define user roles and their responsibilities.</CardDescription>
            </div>
            <Button onClick={() => openDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Role
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-foreground">{role.description}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(role)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) setCurrentRole(null); setIsDialogOpen(open);}}>
            <DialogContent>
                <form action={handleSaveRole}>
                    <DialogHeader>
                        <DialogTitle>{currentRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
                        <DialogDescription>
                            {currentRole ? 'Update the details for this role.' : 'Provide details for the new role.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {currentRole && <input type="hidden" name="id" value={currentRole.id} />}
                        <div className="space-y-2">
                            <Label htmlFor="name">Role Name</Label>
                            <Input id="name" name="name" defaultValue={currentRole?.name || ''} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" defaultValue={currentRole?.description || ''} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Role</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
