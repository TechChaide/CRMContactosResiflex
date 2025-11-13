'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { authService } from '@/services/auth.service';
import { tipoUsuarioAplicacionService } from '@/services/tipoUsuarioAplicacion.service';
import { environment } from '@/environments/environments.prod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

function ChaideLogo() {
  return (
    <div className="flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/img/logo_chaide.svg"
          alt="Chaide Logo"
          width={300}
          height={300}
          priority
        />
      </div>
    </div>
  );
}

const initialState = {
  success: false,
  message: '',
};

function SubmitButton({ pending }: { pending: boolean }) {
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Ingresando...' : 'Ingresar'}
        </Button>
    );
}

export default function LoginPage() {
    const [state, setState] = useState(initialState);
    const [pending, setPending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPending(true);
        setState(initialState);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('usuario');
        const password = formData.get('password');
        if (typeof email !== 'string' || typeof password !== 'string') {
            setState({ success: false, message: 'Usuario y contraseña son requeridos.' });
            setPending(false);
            return;
        }
        try {
            const response = await authService.login({ email, password });

            // Soportar varias formas de respuesta del backend.
            // Casos comunes:
            // 1) { token, user, message }
            // 2) { data: { token, user, message }, message }
            // 3) { data: { data: { token, user } } } (edge anidado)
            const layered = (obj: any, keys: string[]): any => keys.reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
            const token    = layered(response, ['token'])    || layered(response, ['data', 'token'])    || layered(response, ['data', 'data', 'token']);
            const user     = layered(response, ['user'])     || layered(response, ['data', 'user'])     || layered(response, ['data', 'data', 'user']);
            const perfiles = layered(response, ['perfiles']) || layered(response, ['data', 'perfiles']) || layered(response, ['data', 'data', 'perfiles']);
            const message  = layered(response, ['message'])  || layered(response, ['data', 'message']);

                        if (token) {
                                // Guardar datos preliminares.
                                try {
                                        localStorage.setItem('token', token);
                                        if (user) localStorage.setItem('user', JSON.stringify(user));
                                        if (perfiles) localStorage.setItem('perfiles', JSON.stringify(perfiles));
                                } catch {/* ignore quota */}

                                // Validación de acceso por aplicación usando perfiles (si existen).
                                try {
                                    const perfilesArray: any[] = Array.isArray(perfiles) ? perfiles : [];
                                    const aplicacionesEncontradas: string[] = [];
                                    const authorizedProfiles: any[] = [];

                                    if (!perfilesArray.length) {
                                        setState({ success: false, message: 'El usuario no tiene perfiles asignados.' });
                                        setPending(false);
                                        return;
                                    }

                                    for (const perfil of perfilesArray) {
                                        const codigo = perfil?.codigo_tipo_usuario || perfil?.codigoTipoUsuario || perfil?.codigo || perfil?.id;
                                        if (!codigo) continue;
                                        try {
                                            const resp = await tipoUsuarioAplicacionService.getByCodigoTipoUsuario(String(codigo));
                                            const items: any[] = Array.isArray(resp?.data) ? resp.data : [];
                                            for (const item of items) {
                                                const codigoApp = item?.codigo_aplicacion || item?.aplicacion?.codigo_aplicacion;
                                                if (codigoApp) aplicacionesEncontradas.push(codigoApp);
                                                if (codigoApp === environment.nombreAplicacion) {
                                                    // Añadir este perfil si coincide y no duplicar
                                                    if (!authorizedProfiles.includes(perfil)) {
                                                        authorizedProfiles.push(perfil);
                                                    }
                                                    // Romper el loop interno; ya sabemos que este perfil habilita acceso.
                                                    break;
                                                }
                                            }
                                        } catch {/* continuar con siguiente perfil */}
                                    }

                                    if (!authorizedProfiles.length) {
                                        setState({ success: false, message: 'No tiene acceso a esta aplicación.' });
                                        setPending(false);
                                        return;
                                    }

                                    // Guardar todos los perfiles autorizados y también el primero para compatibilidad previa.
                                    try {
                                        localStorage.setItem('perfilesAutorizados', JSON.stringify(authorizedProfiles));
                                        // Ya no se almacena perfilAutorizado individualmente.
                                    } catch {/* ignore */}
                                } catch (validErr) {
                                    setState({ success: false, message: 'Error validando acceso a la aplicación.' });
                                    setPending(false);
                                    return;
                                }

                                window.location.href = '/dashboard';
                                return;
                        }

            // Si el backend dijo login successful pero no envió token, lo tratamos como error de formato.
            setState({
                success: false,
                message: message ? `Respuesta inválida del servidor: falta token. (${message})` : 'Credenciales incorrectas.',
            });
        } catch (error) {
            const errorMessage =
                typeof error === 'object' && error !== null && 'message' in error
                    ? (error as { message?: string }).message
                    : undefined;
            setState({ success: false, message: errorMessage || 'Error de autenticación.' });
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
            <div className="flex items-center justify-center py-12 bg-primary lg:bg-primary">
                <ChaideLogo />
            </div>
            <div className="flex items-center justify-center py-12">
                <Card className="mx-auto max-w-sm w-full shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="flex justify-center items-center gap-2 mb-2">
                            <Image
                                src="/img/Chide.svg"
                                alt="Chaide Logo"
                                width={46}
                                height={46}
                                priority
                            />
                            <CardTitle className="text-2xl">Módulo Base</CardTitle>
                        </div>
                        <CardDescription>
                            Inicio de Sesión
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="usuario">Usuario</Label>
                                    <Input id="usuario" name="usuario" placeholder="Ingrese su usuario" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Ingrese su contraseña"
                                            required
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary focus:outline-none"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                {state && !state.success && state.message && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Error de autenticación</AlertTitle>
                                        <AlertDescription>
                                            {state.message}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <SubmitButton pending={pending} />
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
