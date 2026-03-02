"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Save, Search, Copy, Loader2, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

// Simulación antigua: const USUARIO_ACTUAL = "dex";

interface ContactoResult {
  id: number;
  celular: string;
  nombre_Completo: string;
  ciudad: string;
  tipo_Producto: string;
  fecha_Registro: string;
  observacion: string;
  usuario: string;
}

export default function ContactosPage() {
  const [usuarioActual, setUsuarioActual] = useState("");

  useEffect(() => {
    // Intentar sacar el usuario del localStorage en el cliente
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          // Intentamos obtener el usuario, username, o email
          const usuarioStr =
            parsedUser?.usuario ||
            parsedUser?.username ||
            parsedUser?.email ||
            parsedUser?.correo_usuario ||
            parsedUser?.name ||
            "";
          setUsuarioActual(usuarioStr);
        } catch (e) {
          console.error("Error parseando usuario", e);
        }
      }
    }
  }, []);

  // -- ESTADOS FORMULARIO IZQUIERDO --
  const [formCelular, setFormCelular] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formCiudad, setFormCiudad] = useState("");
  const [formTipoProducto, setFormTipoProducto] = useState("");
  const [formObservacion, setFormObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);

  // -- ESTADOS TABLA Y BÚSQUEDA DERECHA --
  const [contactos, setContactos] = useState<ContactoResult[]>([]);
  const [cargandoContactos, setCargandoContactos] = useState(false);

  const [searchId, setSearchId] = useState("");
  const [searchCelular, setSearchCelular] = useState("");
  const [searchNombre, setSearchNombre] = useState("");
  const [searchCiudad, setSearchCiudad] = useState("");
  const [searchTipoProducto, setSearchTipoProducto] = useState("");
  const [searchObservacion, setSearchObservacion] = useState("");
  const [searchFechaDesde, setSearchFechaDesde] = useState("");
  const [searchFechaHasta, setSearchFechaHasta] = useState("");
  const [buscando, setBuscando] = useState(false);

  // -- HANDLERS DE INPUTS CON VALIDACIONES (FORMULARIO) --
  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo números y símbolo +, máximo 15
    const val = e.target.value.replace(/[^0-9+]/g, "");
    if (val.length <= 15) setFormCelular(val);
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo letras y espacios
    const val = e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, "");
    setFormNombre(val);
  };

  const handleCiudadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo letras
    const val = e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, "");
    setFormCiudad(val);
  };

  // -- LÓGICA DE GUARDADO --
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCelular || !formNombre || !formCiudad || !formTipoProducto || !formObservacion) {
      Swal.fire("Error", "Por favor completa todos los campos del formulario", "warning");
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        celular: formCelular,
        nombre_Completo: formNombre,
        ciudad: formCiudad,
        tipo_Producto: formTipoProducto,
        observacion: formObservacion,
        usuario: usuarioActual,
      };

      const res = await fetch(
        "https://intranet.chaide.com:8050/ApiCRMContactosResiflex/api/ContactosWhatsapp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Error en la respuesta del servidor");
      const data = await res.json();

      if (data && data.id) {
        // Limpiamos formulario
        setFormCelular("");
        setFormNombre("");
        setFormCiudad("");
        setFormTipoProducto("");
        setFormObservacion("");

        Swal.fire({
          icon: "success",
          title: "Contacto Guardado",
          html: `
            <p>ID Generado:</p>
            <h2 style="font-size: 2.5rem; margin: 10px 0;"><strong>${data.id}</strong></h2>
          `,
          showCancelButton: true,
          confirmButtonText: '<i class="lucide lucide-copy"></i> Copiar ID',
          cancelButtonText: "Cerrar",
          confirmButtonColor: "#1e3a8a", // bg-blue-900 equivalent
        }).then((result) => {
          if (result.isConfirmed) {
            navigator.clipboard.writeText(data.id.toString());
            Swal.fire("¡Copiado!", "El ID ha sido copiado al portapapeles.", "success");
          }
        });

        // Recargamos datos base
        cargarContactosInicial();
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Ocurrió un problema al guardar el contacto.", "error");
    } finally {
      setGuardando(false);
    }
  };

  // -- CARGA INICIAL DE CONTACTOS --
  const cargarContactosInicial = async () => {
    setCargandoContactos(true);
    try {
      if (!usuarioActual) return; // Esperar a que el usuario se haya cargado

      const res = await fetch(
        "https://intranet.chaide.com:8050/ApiCRMContactosResiflex/api/ContactosWhatsapp/usuario",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario: usuarioActual }),
        }
      );
      if (!res.ok) throw new Error("Error al obtener contactos iniciales");
      const data = await res.json();
      setContactos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar contactos:", error);
      // Opcional: mostrar notificación de error
    } finally {
      setCargandoContactos(false);
    }
  };

  useEffect(() => {
    if (usuarioActual) {
      cargarContactosInicial();
    }
  }, [usuarioActual]);

  // -- BÚSQUEDA AVANZADA --
  const formatIsoWithMs = (dateString: string): string | null => {
    if (!dateString) return null;
    try {
      // Input date from type="date" comes as "YYYY-MM-DD"
      // convert to "YYYY-MM-DDTHH:mm:ss.SSS"
      // If it's the start date we could use T00:00:00.000, end date T23:59:59.999
      const d = new Date(dateString);
      // Adding hardcoded time or adjusting timezones
      return d.toISOString().split("T")[0] + "T00:00:00.000";
    } catch {
      return null;
    }
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);

    try {
      const payload = {
        id: searchId ? Number(searchId) : null,
        celular: searchCelular || null,
        nombre_Completo: searchNombre || null,
        ciudad: searchCiudad || null,
        tipo_Producto: searchTipoProducto || null,
        observacion: searchObservacion || null,
        fecha_Desde: searchFechaDesde ? searchFechaDesde + "T00:00:00.000" : null,
        fecha_Hasta: searchFechaHasta ? searchFechaHasta + "T23:59:59.999" : null,
        usuario: usuarioActual,
        termino_General: null,
      };

      const res = await fetch(
        "https://intranet.chaide.com:8050/ApiCRMContactosResiflex/api/ContactosWhatsapp/buscar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Error en la búsqueda");
      const data = await res.json();
      setContactos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Ocurrió un problema al realizar la búsqueda.", "error");
    } finally {
      setBuscando(false);
    }
  };

  const handleLimpiarBusqueda = () => {
    setSearchId("");
    setSearchCelular("");
    setSearchNombre("");
    setSearchCiudad("");
    setSearchTipoProducto("");
    setSearchObservacion("");
    setSearchFechaDesde("");
    setSearchFechaHasta("");
    cargarContactosInicial();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 min-h-[calc(100vh-64px)] font-sans antialiased bg-slate-50">
      {/* SECCIÓN 1: FORMULARIO */}
      <div className="w-full lg:w-[30%] shrink-0">
        <Card className="bg-white rounded-lg shadow-md border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800 border-b pb-4">
              Nuevo Contacto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form id="nuevo-contacto-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  value={formCelular}
                  onChange={handleCelularChange}
                  placeholder="Ej: +593 99 123 4567"
                  className="bg-slate-50 border-slate-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  value={formNombre}
                  onChange={handleNombreChange}
                  placeholder="Ingrese el nombre completo"
                  className="bg-slate-50 border-slate-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formCiudad}
                  onChange={handleCiudadChange}
                  placeholder="Ingrese la ciudad"
                  className="bg-slate-50 border-slate-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Producto</Label>
                <Select value={formTipoProducto} onValueChange={setFormTipoProducto} required>
                  <SelectTrigger className="bg-slate-50 border-slate-300">
                    <SelectValue placeholder="Seleccione un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Colchones">Colchones</SelectItem>
                    <SelectItem value="Muebles">Muebles</SelectItem>
                    <SelectItem value="Almohadas">Almohadas</SelectItem>
                    <SelectItem value="Complementos">Complementos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observación</Label>
                <Select value={formObservacion} onValueChange={setFormObservacion} required>
                  <SelectTrigger className="bg-slate-50 border-slate-300">
                    <SelectValue placeholder="Seleccione la observación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                    <SelectItem value="Venta">Venta</SelectItem>
                    <SelectItem value="En Cierre">En Cierre</SelectItem>
                    <SelectItem value="No contesta">No contesta</SelectItem>
                    <SelectItem value="No interesado">No interesado</SelectItem>
                    <SelectItem value="Requerimiento/credito directo">
                      Requerimiento/credito directo
                    </SelectItem>
                    <SelectItem value="Nuevo cliente">Nuevo cliente</SelectItem>
                    <SelectItem value="Sin respuesta">Sin respuesta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              type="submit"
              form="nuevo-contacto-form"
              disabled={guardando}
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground flex items-center justify-center gap-2 py-5"
            >
              {guardando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {guardando ? "Guardando..." : "Guardar Contacto"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* SECCIÓN 2: FILTROS Y TABLA */}
      <div className="w-full lg:w-[70%] flex flex-col gap-6">
        {/* PANEL DE BÚSQUEDA */}
        <Card className="bg-white rounded-lg shadow-md border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-3">
              <Search className="h-5 w-5 text-blue-600" />
              Búsqueda Avanzada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBuscar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">ID Contacto</Label>
                <Input
                  placeholder="ID"
                  className="h-9 text-sm"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Celular</Label>
                <Input
                  placeholder="Celular"
                  className="h-9 text-sm"
                  value={searchCelular}
                  onChange={(e) => setSearchCelular(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre</Label>
                <Input
                  placeholder="Nombre"
                  className="h-9 text-sm"
                  value={searchNombre}
                  onChange={(e) => setSearchNombre(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ciudad</Label>
                <Input
                  placeholder="Ciudad"
                  className="h-9 text-sm"
                  value={searchCiudad}
                  onChange={(e) => setSearchCiudad(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Producto</Label>
                <Select value={searchTipoProducto} onValueChange={setSearchTipoProducto}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Cualquiera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Colchones">Colchones</SelectItem>
                    <SelectItem value="Muebles">Muebles</SelectItem>
                    <SelectItem value="Almohadas">Almohadas</SelectItem>
                    <SelectItem value="Complementos">Complementos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Observación</Label>
                <Select value={searchObservacion} onValueChange={setSearchObservacion}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Cualquiera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                    <SelectItem value="Venta">Venta</SelectItem>
                    <SelectItem value="En Cierre">En Cierre</SelectItem>
                    <SelectItem value="No contesta">No contesta</SelectItem>
                    <SelectItem value="No interesado">No interesado</SelectItem>
                    <SelectItem value="Requerimiento/credito directo">
                      Req. Crédito
                    </SelectItem>
                    <SelectItem value="Nuevo cliente">Nuevo cliente</SelectItem>
                    <SelectItem value="Sin respuesta">Sin respuesta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Fecha Desde</Label>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={searchFechaDesde}
                  onChange={(e) => setSearchFechaDesde(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Fecha Hasta</Label>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={searchFechaHasta}
                  onChange={(e) => setSearchFechaHasta(e.target.value)}
                />
              </div>

              <div className="col-span-full flex gap-3 lg:justify-end mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLimpiarBusqueda}
                  disabled={buscando}
                  className="h-9 px-4 text-slate-600"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
                <Button
                  type="submit"
                  disabled={buscando}
                  className="h-9 px-6 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {buscando ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Buscar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* TABLA DE RESULTADOS */}
        <Card className="bg-white rounded-lg shadow-md border-slate-200 flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-800 border-b pb-3">
              Directorio de Contactos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0 px-6 pb-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Observación</TableHead>
                    <TableHead className="text-right">Fecha Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargandoContactos ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
                        Cargando contactos...
                      </TableCell>
                    </TableRow>
                  ) : contactos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-400 italic">
                        Aún no hay contactos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contactos.map((contacto) => (
                      <TableRow key={contacto.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-600">
                          {contacto.id}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          {contacto.nombre_Completo}
                        </TableCell>
                        <TableCell>{contacto.celular}</TableCell>
                        <TableCell>{contacto.ciudad}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {contacto.tipo_Producto}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-500">
                            {contacto.observacion}
                          </span>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-sm text-slate-500">
                          {contacto.fecha_Registro
                            ? new Date(contacto.fecha_Registro).toLocaleDateString() +
                            " " +
                            new Date(contacto.fecha_Registro).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
