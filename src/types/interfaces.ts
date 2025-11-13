
// Este archivo es autogenerado. No lo modifiques manually.

export interface Aplicacion {
  codigo_aplicacion: string;
  nombre_aplicacion: string;
  estado: string;
}

export interface Clase {
  codigo_clase: number;
  nombre_clase: string;
  estado: string;
}

export interface Menu {
  codigo_menu: number;
  codigo_padre: number;
  nombre: string;
  icono: string;
  path: string;
  estado: string;
  codigo_aplicacion: string;
}

export interface MenuTipoUsuario {
  codigo_menu_tipo_usuario: number;
  estado: string;
  usuario_modificacion: string;
  fecha_modificacion: Date | string;
  codigo_menu: number;
  codigo_tipo_usuario: number;
}

export interface Permisos {
  codigo_permiso: number;
  estado: string;
  usuario_modificacion: string;
  fecha_modificacion: Date | string;
  codigo_tipo_permiso: number;
  codigo_menu_tipo_usuario: number;
}

export interface Propiedad {
  codigo_propiedad: number;
  nombre_propiedad: string;
  valor_propiedad: string;
  estado: string;
  codigo_aplicacion: string;
}

export interface TipoPermiso {
  codigo_tipo_permiso: number;
  nombre_tipo_permiso: string;
  mnemonico: string;
  estado: string;
}

export interface TipoUsuario {
  codigo_tipo_usuario: number;
  codigo_clase: number;
  nombre_tipo_usuario: string;
  estado: string;
  usuario_modificacion: string;
  fecha_modificacion: Date | string;
}

export interface TipoUsuarioAplicacion {
  codigo_tipo_usuario_aplicacion: number;
  estado: string;
  usuario_modificacion: string;
  fecha_modificacion: Date | string;
  codigo_aplicacion: string;
  codigo_tipo_usuario: number;
}

export interface Usuario {
  codigo_usuario: number;
  id_usuario: string;
  condicion: string;
  estado: string;
  usuario_modificacion: string;
  fecha_modificacion: Date | string;
  codigo_tipo_usuario: number;
}

export interface UsuarioTipoUsuario {
  codigo_usuario_tipo_usuario: number;
  estado: string;
  codigo_usuario: number;
  codigo_tipo_usuario: number;
}

export interface Auth {
  message: string;
  token: string;
  expiresIn: string;
  user:User;
  perfiles: any;
}

export interface User {
  codigo_usuario: number;
  usuario: string;
  correo_usuario: string;
  condicion: string;
}