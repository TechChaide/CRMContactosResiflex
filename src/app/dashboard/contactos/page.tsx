"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { Save, Search, Copy, Loader2, RefreshCw, ChevronLeft, ChevronRight, Upload, FileSpreadsheet, X } from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

// Simulación antigua: const USUARIO_ACTUAL = "dex";

interface ContactoResult {
  id: number;
  celular: string;
  nombre_Completo: string;
  ciudad: string;
  tipo_Producto: string;
  fecha_Registro: string;
  observacion: string;
  canal: string;
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

  // -- ESTADOS CARGA MASIVA --
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);
  const [cargandoMasivo, setCargandoMasivo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleArchivoExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      Swal.fire("Archivo inválido", "Por favor selecciona un archivo Excel (.xlsx o .xls)", "warning");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setArchivoExcel(file);
  };

  const handleQuitarArchivo = () => {
    setArchivoExcel(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const CABECERAS_REQUERIDAS = ["celular", "nombre_completo", "ciudad", "tipo_producto", "observacion", "canal"];

  const validarCabecerasExcel = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
          if (!rows || rows.length === 0) { resolve(false); return; }
          const headers = (rows[0] as string[]).map((h) => String(h).trim().toLowerCase());
          const faltantes = CABECERAS_REQUERIDAS.filter((c) => !headers.includes(c));
          if (faltantes.length > 0) {
            Swal.fire({
              icon: "error",
              title: "Formato incorrecto",
              html: `El documento no cumple con el formato requerido para la carga de datos.<br/><br/>
                <b>Columnas faltantes:</b> <span style="color:#dc2626">${faltantes.join(", ")}</span><br/><br/>
                <b>Columnas requeridas:</b><br/>
                <code style="font-size:0.85rem">${CABECERAS_REQUERIDAS.join(" | ")}</code>`,
            });
            resolve(false);
          } else {
            resolve(true);
          }
        } catch {
          Swal.fire("Error", "No se pudo leer el archivo Excel.", "error");
          resolve(false);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const [progresoCarga, setProgresoCarga] = useState({ actual: 0, total: 0 });

  const leerFilasExcel = (file: File): Promise<Record<string, string>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, {
            defval: "",
          });
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleCargaMasiva = async () => {
    if (!archivoExcel) return;
    const esValido = await validarCabecerasExcel(archivoExcel);
    if (!esValido) return;

    let filas: Record<string, string>[] = [];
    try {
      filas = await leerFilasExcel(archivoExcel);
    } catch {
      Swal.fire("Error", "No se pudo leer el archivo Excel.", "error");
      return;
    }

    // Filtrar filas que tengan al menos el celular
    const filasValidas = filas.filter((f) => String(f["celular"] ?? "").trim() !== "");
    if (filasValidas.length === 0) {
      Swal.fire("Sin datos", "El archivo no contiene filas con datos para importar.", "warning");
      return;
    }

    setCargandoMasivo(true);
    setProgresoCarga({ actual: 0, total: filasValidas.length });

    let insertados = 0;
    let fallidos = 0;

    for (let i = 0; i < filasValidas.length; i++) {
      const fila = filasValidas[i];
      setProgresoCarga({ actual: i + 1, total: filasValidas.length });
      try {
        const payload = {
          celular: String(fila["celular"] ?? "").trim(),
          nombre_Completo: String(fila["nombre_completo"] ?? "").trim(),
          ciudad: String(fila["ciudad"] ?? "").trim(),
          tipo_Producto: String(fila["tipo_producto"] ?? "").trim(),
          observacion: String(fila["observacion"] ?? "").trim(),
          canal: String(fila["canal"] ?? "").trim(),
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

        if (!res.ok) throw new Error("Error en fila " + (i + 2));
        insertados++;
      } catch {
        fallidos++;
      }
    }

    setArchivoExcel(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setProgresoCarga({ actual: 0, total: 0 });
    setCargandoMasivo(false);

    Swal.fire({
      icon: fallidos === 0 ? "success" : "warning",
      title: "Carga Masiva Completada",
      html: `
        <p>✅ <b>Insertados correctamente:</b> ${insertados}</p>
        ${fallidos > 0 ? `<p>❌ <b>Con error:</b> ${fallidos}</p>` : ""}
      `,
    });
    cargarContactosInicial();
  };

  // -- ESTADOS FORMULARIO IZQUIERDO --
  const [formCelular, setFormCelular] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formCiudad, setFormCiudad] = useState("");
  const [formTipoProducto, setFormTipoProducto] = useState("");
  const [formObservacion, setFormObservacion] = useState("");
  const [formCanal, setFormCanal] = useState("");
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
  const [searchCanal, setSearchCanal] = useState("");
  const [buscando, setBuscando] = useState(false);

  // -- PAGINACIÓN --
  const ITEMS_POR_PAGINA = 10;
  const [paginaActual, setPaginaActual] = useState(1);

  const totalPaginas = Math.ceil(contactos.length / ITEMS_POR_PAGINA);
  const contactosPaginados = contactos.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  // -- FALLBACK PARA COPIAR EN CONTEXTOS NO SEGUROS (HTTP) --
  const copyFallback = (text: string) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (success) {
        Swal.fire("¡Copiado!", "El ID ha sido copiado al portapapeles.", "success");
      } else {
        Swal.fire("ID copiado manualmente", `El ID es: ${text}`, "info");
      }
    } catch {
      Swal.fire("ID copiado manualmente", `El ID es: ${text}`, "info");
    }
  };

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
    if (!formCelular || !formNombre || !formCiudad || !formTipoProducto || !formObservacion || !formCanal) {
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
        canal: formCanal,
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
        setFormCanal("");

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
            const idStr = data.id.toString();
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(idStr).then(() => {
                Swal.fire("¡Copiado!", "El ID ha sido copiado al portapapeles.", "success");
              }).catch(() => {
                copyFallback(idStr);
              });
            } else {
              copyFallback(idStr);
            }
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
      setPaginaActual(1);
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
        canal: searchCanal || null,
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
      setPaginaActual(1);
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
    setSearchCanal("");
    cargarContactosInicial();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 p-2 lg:p-4 lg:h-screen lg:overflow-hidden font-sans antialiased bg-slate-50">
      {/* SECCIÓN 1: IZQUIERDA (Carga Masiva + Formulario) */}
      <div className="w-full lg:w-[30%] shrink-0 lg:h-full lg:overflow-y-auto flex flex-col gap-2 lg:gap-3">

        {/* CARGA MASIVA */}
        <Card className="bg-white rounded-lg shadow-md border-slate-200">
          <CardHeader className="px-3 py-2">
            <CardTitle className="text-sm font-semibold text-slate-800 border-b pb-1.5 flex items-center gap-2">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Carga Masiva
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-1.5 pb-3 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleArchivoExcelChange}
            />
            <div className="space-y-1">
              <Label className="text-xs">Archivo Excel</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-7 text-xs flex-1 border-dashed border-slate-400 text-slate-600 hover:bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Seleccionar Excel
                </Button>
              </div>
              {archivoExcel && (
                <div className="flex items-center gap-2 mt-1.5 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-emerald-800 font-medium truncate flex-1">{archivoExcel.name}</span>
                  <button
                    type="button"
                    onClick={handleQuitarArchivo}
                    className="text-emerald-500 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <Button
              type="button"
              disabled={!archivoExcel || cargandoMasivo}
              onClick={handleCargaMasiva}
              className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              {cargandoMasivo ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 mr-1.5" />
              )}
              {cargandoMasivo
                ? progresoCarga.total > 0
                  ? `Insertando ${progresoCarga.actual}/${progresoCarga.total}...`
                  : "Procesando..."
                : "Cargar Datos"}
            </Button>
          </CardContent>
        </Card>

        {/* FORMULARIO NUEVO CONTACTO */}
        <Card className="bg-white rounded-lg shadow-md border-slate-200">
          <CardHeader className="px-3 py-2">
            <CardTitle className="text-sm font-semibold text-slate-800 border-b pb-1.5">
              Nuevo Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-1.5 pb-2">
            <form id="nuevo-contacto-form" onSubmit={handleSubmit} className="space-y-2">
              <div className="space-y-0.5">
                <Label className="text-xs" htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  value={formCelular}
                  onChange={handleCelularChange}
                  placeholder="Ej: +593 99 123 4567"
                  className="h-7 text-xs bg-slate-50 border-slate-300"
                  required
                />
              </div>

              <div className="space-y-0.5">
                <Label className="text-xs" htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  value={formNombre}
                  onChange={handleNombreChange}
                  placeholder="Ingrese el nombre completo"
                  className="h-7 text-xs bg-slate-50 border-slate-300"
                  required
                />
              </div>

              <div className="space-y-0.5">
                <Label className="text-xs" htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formCiudad}
                  onChange={handleCiudadChange}
                  placeholder="Ingrese la ciudad"
                  className="h-7 text-xs bg-slate-50 border-slate-300"
                  required
                />
              </div>

              <div className="space-y-0.5">
                <Label className="text-xs">Tipo de Producto</Label>
                <Select value={formTipoProducto} onValueChange={setFormTipoProducto} required>
                  <SelectTrigger className="h-7 text-xs bg-slate-50 border-slate-300">
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

              <div className="space-y-0.5">
                <Label className="text-xs">Observación</Label>
                <Select value={formObservacion} onValueChange={setFormObservacion} required>
                  <SelectTrigger className="h-7 text-xs bg-slate-50 border-slate-300">
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

              <div className="space-y-0.5">
                <Label className="text-xs">Canal</Label>
                <Input
                  value={formCanal}
                  onChange={(e) => setFormCanal(e.target.value)}
                  placeholder="Ej: WhatsApp, Llamada, Email..."
                  className="h-7 text-xs bg-slate-50 border-slate-300"
                  required
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="px-3 pt-1.5 pb-3">
            <Button
              type="submit"
              form="nuevo-contacto-form"
              disabled={guardando}
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground flex items-center justify-center gap-1.5 h-8 text-xs"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {guardando ? "Guardando..." : "Guardar Contacto"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* SECCIÓN 2: FILTROS Y TABLA */}
      <div className="w-full lg:w-[70%] flex flex-col gap-2 lg:gap-3 min-h-0 lg:overflow-hidden">
        {/* PANEL DE BÚSQUEDA */}
        <Card className="bg-white rounded-lg shadow-md border-slate-200 shrink-0">
          <CardHeader className="px-3 py-1.5">
            <CardTitle className="text-xs font-semibold text-slate-800 flex items-center gap-2 border-b pb-1.5">
              <Search className="h-3.5 w-3.5 text-blue-600" />
              Búsqueda Avanzada
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2 pt-1.5">
            <form onSubmit={handleBuscar} className="flex flex-col gap-2">
              {/* FILA 1: ID, Celular, Nombre, Ciudad, Tipo Producto */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <div className="space-y-0.5">
                  <Label className="text-xs">ID Contacto</Label>
                  <Input
                    placeholder="ID"
                    className="h-7 text-xs"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs">Celular</Label>
                  <Input
                    placeholder="Celular"
                    className="h-7 text-xs"
                    value={searchCelular}
                    onChange={(e) => setSearchCelular(e.target.value)}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    placeholder="Nombre"
                    className="h-7 text-xs"
                    value={searchNombre}
                    onChange={(e) => setSearchNombre(e.target.value)}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs">Ciudad</Label>
                  <Input
                    placeholder="Ciudad"
                    className="h-7 text-xs"
                    value={searchCiudad}
                    onChange={(e) => setSearchCiudad(e.target.value)}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs">Tipo de Producto</Label>
                  <Select value={searchTipoProducto} onValueChange={setSearchTipoProducto}>
                    <SelectTrigger className="h-7 text-xs">
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
              </div>

              {/* FILA 2: Observación, Fecha Desde, Fecha Hasta, Canal, Botones */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 items-end">
                <div className="space-y-0.5">
                  <Label className="text-xs">Observación</Label>
                  <Select value={searchObservacion} onValueChange={setSearchObservacion}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                      <SelectItem value="Venta">Venta</SelectItem>
                      <SelectItem value="En Cierre">En Cierre</SelectItem>
                      <SelectItem value="No contesta">No contesta</SelectItem>
                      <SelectItem value="No interesado">No interesado</SelectItem>
                      <SelectItem value="Requerimiento/credito directo">Req. Crédito</SelectItem>
                      <SelectItem value="Nuevo cliente">Nuevo cliente</SelectItem>
                      <SelectItem value="Sin respuesta">Sin respuesta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs">Fecha Desde</Label>
                  <Input
                    type="date"
                    className="h-7 text-xs"
                    value={searchFechaDesde}
                    onChange={(e) => setSearchFechaDesde(e.target.value)}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs">Fecha Hasta</Label>
                  <Input
                    type="date"
                    className="h-7 text-xs"
                    value={searchFechaHasta}
                    onChange={(e) => setSearchFechaHasta(e.target.value)}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs">Canal</Label>
                  <Input
                    placeholder="Canal"
                    className="h-7 text-xs"
                    value={searchCanal}
                    onChange={(e) => setSearchCanal(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLimpiarBusqueda}
                    disabled={buscando}
                    className="h-6 w-full text-xs text-slate-600 px-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Limpiar
                  </Button>
                  <Button
                    type="submit"
                    disabled={buscando}
                    className="h-6 w-full text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2"
                  >
                    {buscando ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Search className="h-3 w-3 mr-1" />
                    )}
                    Buscar
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* TABLA DE RESULTADOS */}
        <Card className="bg-white rounded-lg shadow-md border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="px-3 py-1.5">
            <CardTitle className="text-xs font-semibold text-slate-800 border-b pb-1.5 flex items-center justify-between">
              <span>Directorio de Contactos</span>
              {contactos.length > 0 && (
                <span className="text-xs font-normal text-slate-500">
                  {contactos.length} registro{contactos.length !== 1 ? "s" : ""}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0 px-3 pb-2">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[60px] text-xs py-2">ID</TableHead>
                    <TableHead className="text-xs py-2">Nombre Completo</TableHead>
                    <TableHead className="text-xs py-2">Celular</TableHead>
                    <TableHead className="text-xs py-2">Ciudad</TableHead>
                    <TableHead className="text-xs py-2">Producto</TableHead>
                    <TableHead className="text-xs py-2">Observación</TableHead>
                    <TableHead className="text-xs py-2">Canal</TableHead>
                    <TableHead className="text-xs py-2 text-right">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargandoContactos ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-400" />
                        Cargando contactos...
                      </TableCell>
                    </TableRow>
                  ) : contactos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-slate-400 italic text-sm">
                        Aún no hay contactos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contactosPaginados.map((contacto) => (
                      <TableRow key={contacto.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-xs py-2 font-medium text-slate-600">
                          {contacto.id}
                        </TableCell>
                        <TableCell className="text-xs py-2 font-semibold text-slate-800">
                          {contacto.nombre_Completo}
                        </TableCell>
                        <TableCell className="text-xs py-2">{contacto.celular}</TableCell>
                        <TableCell className="text-xs py-2">{contacto.ciudad}</TableCell>
                        <TableCell className="text-xs py-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {contacto.tipo_Producto}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs py-2 text-slate-500">
                          {contacto.observacion}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-slate-500">
                          {contacto.canal}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right whitespace-nowrap text-slate-500">
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

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-3 pb-2 pt-1.5 border-t flex-wrap gap-1">
              <span className="text-xs text-slate-500">
                Pág. {paginaActual}/{totalPaginas} · {(paginaActual - 1) * ITEMS_POR_PAGINA + 1}–{Math.min(paginaActual * ITEMS_POR_PAGINA, contactos.length)} de {contactos.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaActual === 1}
                >
                  <ChevronLeft className="h-3 w-3" /><ChevronLeft className="h-3 w-3 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant={paginaActual === item ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs ${
                          paginaActual === item ? "bg-primary text-primary-foreground" : ""
                        }`}
                        onClick={() => setPaginaActual(item as number)}
                      >
                        {item}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                >
                  <ChevronRight className="h-3 w-3" /><ChevronRight className="h-3 w-3 -ml-2" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
