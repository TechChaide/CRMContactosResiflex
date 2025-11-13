"use client";

import { AppShell, AppShellContent, AppShellHeader } from '@/components/layout/app-shell';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar-new';
import { ProtectedRoute } from '@/components/protected-route';
import Image from 'next/image';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronsUpDown, BookUser, Shield, Users, Settings, Building, MenuSquare, UserCog, UserPlus, Minus, LogOut, CircleUser, AppWindow } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { menuService } from '@/services/menu.service';
import { useToast } from '@/hooks/use-toast';
// (LogoutButton preserved in repo but not used here; we implement custom panel UI)


// Tipo local ampliado para soportar children anidados (el backend envía árbol).
type MenuNode = {
    codigo_menu: number;
    codigo_padre: number | null;
    nombre: string;
    icono: string;
    path: string;
    estado: string;
    codigo_aplicacion: string;
    children?: MenuNode[];
};

// Mapa de iconos string -> componente Lucide
const iconMap: Record<string, React.ComponentType<any>> = {
    Shield,
    BookUser,
    Users,
    Settings,
    Building,
    MenuSquare,
    UserCog,
    UserPlus,
    CircleUser,
    AppWindow,
};

// Fusionar árboles de menús por codigo_menu (recursivo)
function mergeMenuTrees(trees: MenuNode[]): MenuNode[] {
    const byId = new Map<number, MenuNode>();

    const mergeInto = (target: MenuNode, source: MenuNode) => {
        if (!source.children || source.children.length === 0) return;
        target.children = target.children || [];
        const childMap = new Map<number, MenuNode>(target.children.map(c => [c.codigo_menu, c]));
        for (const sc of source.children) {
            const existing = childMap.get(sc.codigo_menu);
            if (existing) {
                mergeInto(existing, sc);
            } else {
                // Clonar superficialmente
                childMap.set(sc.codigo_menu, { ...sc, children: sc.children ? [...sc.children] : [] });
            }
        }
        target.children = Array.from(childMap.values()).sort((a, b) => a.codigo_menu - b.codigo_menu);
    };

    for (const root of trees) {
        const existing = byId.get(root.codigo_menu);
        if (existing) {
            mergeInto(existing, root);
        } else {
            byId.set(root.codigo_menu, { ...root, children: root.children ? [...root.children] : [] });
        }
    }
    return Array.from(byId.values()).sort((a, b) => a.codigo_menu - b.codigo_menu);
}

// Filtrar solo nodos activos (estado === 'A'). Mantener nodos agrupadores si conservan hijos activos.
function filterActive(nodes: MenuNode[]): MenuNode[] {
    const result: MenuNode[] = [];
    for (const n of nodes) {
        const children = n.children ? filterActive(n.children) : [];
        const isGroupish = n.path === '.' || n.path === '|' || !n.path || n.path === '#';
        const isActive = n.estado === 'A';
        if ((isActive && !isGroupish) || (isActive && isGroupish) || (isGroupish && children.length)) {
            result.push({ ...n, children });
        }
    }
    return result;
}

// Transformar árbol backend -> estructura esperada por RecursiveMenu
function toRecursiveItems(nodes: MenuNode[]): any[] {
    return nodes.map(n => {
        const IconComp = iconMap[n.icono] || Shield;
        const hasChildren = !!(n.children && n.children.length);
        // Reglas:
        // '.' => raíz (no navegable)
        // '|' => agrupador (no navegable)
        // otro valor => ruta navegable
        const isRoot = n.path === '.';
        const isBranch = n.path === '|';
        const isNavigable = !(isRoot || isBranch) && !!n.path;
        const children = hasChildren ? toRecursiveItems(n.children!) : undefined;
        return {
            label: n.nombre,
            icon: IconComp,
            path: isNavigable ? n.path : undefined,
            children
        };
    });
}

const RecursiveMenu = ({ items, level = 0 }: { items: any[], level?: number }) => {
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();
    return (
        <div className="w-full" style={{ paddingLeft: level > 0 && !isCollapsed ? '1rem' : '0' }}>
            {items.map((item, index) => (
                <Collapsible key={index} className={isCollapsed ? 'w-full flex justify-center' : 'w-full'} defaultOpen>
                    {item.children ? (
                        <>
                            <CollapsibleTrigger className={isCollapsed ? 'w-10 h-10 flex items-center justify-center rounded-md hover:bg-primary-foreground/10' : 'w-full'} title={isCollapsed ? item.label : undefined}>
                                <div className={isCollapsed ? 'flex items-center justify-center' : 'flex items-center justify-between w-full p-2 rounded-md hover:bg-primary/80'}>
                                    <div className={isCollapsed ? 'flex items-center' : 'flex items-center gap-2'}>
                                        <item.icon className="h-5 w-5" />
                                        {!isCollapsed && <span>{item.label}</span>}
                                    </div>
                                    {!isCollapsed && <ChevronsUpDown className="h-4 w-4" />}
                                </div>
                            </CollapsibleTrigger>
                            {!isCollapsed && (
                                <CollapsibleContent>
                                    <RecursiveMenu items={item.children} level={level + 1} />
                                </CollapsibleContent>
                            )}
                        </>
                    ) : (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                href={item.path || '#'}
                                active={item.path && pathname?.startsWith(item.path)}
                                className={isCollapsed ? 'h-10 w-10 justify-center' : 'justify-start pl-4 h-9'}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon className={isCollapsed ? 'h-5 w-5' : 'h-4 w-4 mr-2'} />
                                {!isCollapsed && item.label}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </Collapsible>
            ))}
        </div>
    );
};

// Sección superior: solo logo (varía colapsado / expandido)
function LogoSection() {
    const { isCollapsed } = useSidebar();
    if (isCollapsed) {
        return (
            <div className="flex items-center justify-center py-4">
                <Image src="/img/Chide.svg" alt="Chaide Logo" width={40} height={40} />
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center py-4">
            <Image src="/img/logo_chaide.svg" alt="Chaide Logo" width={170} height={46} />
        </div>
    );
}

// Panel inferior: info usuario + logout
function UserPanel() {
    const { isCollapsed } = useSidebar();
    const [userInfo, setUserInfo] = useState<any>(null);
    const [authorizedProfiles, setAuthorizedProfiles] = useState<any[]>([]);

    useEffect(() => {
        try {
            let payload: any = null;
            const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (rawToken) {
                const parts = rawToken.split('.');
                if (parts.length >= 2) {
                    try {
                        const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
                        payload = JSON.parse(payloadStr);
                    } catch { /* ignore decode errors */ }
                }
            }
            // Fallback user object stored separately
            if (!payload) {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try { payload = JSON.parse(userStr); } catch { /* ignore */ }
                }
            }
            if (payload) setUserInfo(payload);

            // Leer todos los perfiles autorizados
            const perfilesAutorizadosStr = localStorage.getItem('perfilesAutorizados');
            if (perfilesAutorizadosStr) {
                try {
                    const parsed = JSON.parse(perfilesAutorizadosStr);
                    if (Array.isArray(parsed)) setAuthorizedProfiles(parsed);
                } catch { /* ignore */ }
            }
        } catch { /* swallow */ }
    }, []);

    const displayName: string = userInfo?.name || userInfo?.usuario || userInfo?.username || userInfo?.correo_usuario || userInfo?.email || userInfo?.sub || 'Usuario';
    const tiposUsuarioNombres: string | undefined = authorizedProfiles
        .map(p => p?.tipo_usuario?.nombre_tipo_usuario)
        .filter(Boolean)
        .join(', ');
    const avatarText = (displayName || '?').trim().charAt(0).toUpperCase();

    const handleLogout = () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('perfilesAutorizados');
            localStorage.clear(); // Eliminar todas las variables de sesión
        } catch (error) {
            console.error('Error al limpiar localStorage:', error);
        }
        window.location.href = '/';
    };

    if (isCollapsed) {
        return (
            <div className="flex items-center justify-center py-4 border-t border-white/10">
                <button
                    aria-label="Cerrar sesión"
                    onClick={handleLogout}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-primary shadow hover:scale-105 transition"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="w-full px-0 pb-4 border-t border-white/10 mt-auto mb-16">
            <div className="flex items-center gap-4 rounded-2xl bg-white/15 px-3 py-3 backdrop-blur-sm border border-white/10 shadow-inner mx-0">
                <div className="flex-1 min-w-0 leading-tight">
                    <p className="text-base font-semibold text-white break-words" title={displayName}>{displayName}</p>
                    {tiposUsuarioNombres && (
                        <p className="text-xs text-white/80" title={tiposUsuarioNombres}>{tiposUsuarioNombres}</p>
                    )}
                    {userInfo?.email && <p className="text-[11px] text-white/60" title={userInfo.email}>{userInfo.email}</p>}
                </div>
                <button
                    aria-label="Cerrar sesión"
                    onClick={handleLogout}
                    className="h-12 w-12 flex items-center justify-center rounded-full bg-white text-primary shadow hover:scale-105 transition"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [menuLoading, setMenuLoading] = useState<boolean>(true);
    const [menuError, setMenuError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const loadMenus = async () => {
            try {
                const perfilesAutorizadosStr = typeof window !== 'undefined' ? localStorage.getItem('perfilesAutorizados') : null;
                if (!perfilesAutorizadosStr) {
                    toast({
                        title: "Sin permisos de menú",
                        description: "No tienes perfiles autorizados para acceder al sistema",
                        variant: "destructive",
                    });
                    router.push('/');
                    return;
                }
                const perfiles: any[] = JSON.parse(perfilesAutorizadosStr);
                const codigoList = perfiles
                    .map(p => p?.tipo_usuario?.codigo_tipo_usuario || p?.codigo_tipo_usuario || p?.codigoTipoUsuario || p?.codigo || p?.id)
                    .filter(Boolean);
                if (!codigoList.length) {
                    toast({
                        title: "Sin códigos de perfil",
                        description: "No se encontraron códigos válidos en tus perfiles autorizados",
                        variant: "destructive",
                    });
                    router.push('/');
                    return;
                }
                // Llamadas en paralelo; ignorar individuales fallidas pero registrar si todas fallan
                const results: MenuNode[] = [];
                await Promise.all(codigoList.map(async codigo => {
                    try {
                        const resp = await menuService.getMenuByCodigoTipoUsuario(String(codigo));
                        // Posibles formas: { data: {...} } ó directamente {...}
                        const candidate: any = (resp as any)?.data && (resp as any).data.codigo_menu ? (resp as any).data : resp;
                        if (candidate && typeof candidate === 'object' && candidate.codigo_menu) {
                            results.push(candidate as MenuNode);
                        }
                    } catch { /* ignorar error individual */ }
                }));
                if (!results.length) {
                    toast({
                        title: "Sin menú disponible",
                        description: "No se pudo cargar el menú para tus perfiles. Contacta al administrador del sistema",
                        variant: "destructive",
                    });
                    router.push('/');
                    return;
                } else {
                    const merged = mergeMenuTrees(results);
                    const active = filterActive(merged);
                    const menuItemsResult = toRecursiveItems(active);
                    
                    // Verificar que después del filtrado aún tengamos elementos de menú
                    if (!menuItemsResult.length) {
                        toast({
                            title: "Sin opciones de menú",
                            description: "No tienes opciones de menú activas disponibles",
                            variant: "destructive",
                        });
                        router.push('/');
                        return;
                    }
                    
                    setMenuItems(menuItemsResult);
                }
            } catch (err: any) {
                toast({
                    title: "Error cargando menú",
                    description: err?.message || 'Error inesperado al cargar el menú del sistema',
                    variant: "destructive",
                });
                router.push('/');
            } finally {
                setMenuLoading(false);
            }
        };
        loadMenus();
    }, [toast, router]);

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen w-full bg-background">
                <Sidebar>
                    <SidebarHeader>
                        <LogoSection />
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            {menuLoading && (
                                <div className="text-xs text-white/70 px-2 py-1">Cargando menú...</div>
                            )}
                            {!menuLoading && menuError && (
                                <div className="text-xs text-red-200 px-2 py-1">{menuError}</div>
                            )}
                            {!menuLoading && !menuError && menuItems.length > 0 && (
                                <RecursiveMenu items={menuItems} />
                            )}
                            {!menuLoading && !menuError && menuItems.length === 0 && (
                                <div className="text-xs text-white/60 px-2 py-1">Sin opciones de menú</div>
                            )}
                        </SidebarMenu>
                    </SidebarContent>
                    <UserPanel />
                </Sidebar>
                <div className="flex flex-col flex-1">
                    {children}
                </div>
            </div>
        </ProtectedRoute>
    )
}
