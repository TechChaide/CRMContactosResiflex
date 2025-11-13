'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        const perfilesAutorizados = localStorage.getItem('perfilesAutorizados');

        if (!token || !userData) {
          setIsAuthenticated(false);
          setUser(null);
          toast({
            title: "Sesión requerida",
            description: "Debes iniciar sesión para acceder a esta página",
            variant: "destructive",
          });
          router.push('/');
          return;
        }

        // Verificar que el usuario tenga perfiles autorizados
        if (!perfilesAutorizados) {
          setIsAuthenticated(false);
          setUser(null);
          toast({
            title: "Sin permisos",
            description: "No tienes permisos para acceder al dashboard",
            variant: "destructive",
          });
          router.push('/');
          return;
        }

        try {
          const parsedUser = JSON.parse(userData);
          const parsedPerfiles = JSON.parse(perfilesAutorizados);
          
          // Verificar que tenga al menos un perfil válido
          if (!Array.isArray(parsedPerfiles) || parsedPerfiles.length === 0) {
            setIsAuthenticated(false);
            setUser(null);
            toast({
              title: "Sin permisos",
              description: "No tienes perfiles autorizados para acceder al dashboard",
              variant: "destructive",
            });
            router.push('/');
            return;
          }

          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (parseError) {
          setIsAuthenticated(false);
          setUser(null);
          toast({
            title: "Error de sesión",
            description: "Datos de sesión inválidos. Por favor inicia sesión nuevamente",
            variant: "destructive",
          });
          router.push('/');
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        toast({
          title: "Error de autenticación",
          description: "Error al verificar la sesión",
          variant: "destructive",
        });
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, toast]);

  return {
    isAuthenticated,
    isLoading,
    user,
  };
}