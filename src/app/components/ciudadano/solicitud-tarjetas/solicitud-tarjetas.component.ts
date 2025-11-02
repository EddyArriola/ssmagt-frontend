import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FileUploadService, FileUploadResult } from '../../../services/file-upload.service';
import { AuthService } from '../../../services/auth.service';
import { SolicitudTarjetaService } from '../../../services/solicitud-tarjeta.service';
import { CiudadanoService } from '../../../services/ciudadano.service';
import { CentroDeSalud, CreateSolicitudTarjetaDto } from '../../../interfaces/solicitud-tarjeta';
import { tarjeta } from '../../../interfaces/tarjetas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-solicitud-tarjetas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitud-tarjetas.component.html',
  styleUrls: ['./solicitud-tarjetas.component.css']
})
export class SolicitudTarjetasComponent implements OnInit {
  // Estados de la interfaz
  mostrarSeccionArchivo = false;
  mostrarSeleccionCentro = false;
  mostrarSeccionAlimentos = false;
  mostrarModalGuia = false;
  mostrarExamen = false;
  tipoSeleccionado = '';
  
  // Control de tarjetas vigentes
  tarjetasUsuario: tarjeta[] = [];
  tieneTarjetasVigentes = false;
  infoTarjetasVigentes: any = null;
  
  // Estados del examen
  respuestasExamen: { [key: number]: string } = {};
  examenCompletado = false;
  puntajeExamen = 0;
  generandoPDF = false;
  pdfGenerado: FileUploadResult | null = null;
  
  // Preguntas del examen
  preguntasExamen = [
    { id: 1, pregunta: "¿Quién es un manipulador de alimentos?" },
    { id: 2, pregunta: "¿Cómo se adquieren las enfermedades transmitidas por alimentos?" },
    { id: 3, pregunta: "Los alimentos contaminados pueden causar 2 tipos de enfermedades, ¿cuáles son?" },
    { id: 4, pregunta: "¿Quiénes son los principales causantes de las diarreas?" },
    { id: 5, pregunta: "¿Cuáles son las etapas del consumo de los alimentos?" },
    { id: 6, pregunta: "¿Qué es contaminación y qué tipos de contaminación hay?" },
    { id: 7, pregunta: "Explique las etapas de un adecuado lavado de manos y ¿cuándo se debe realizar?" },
    { id: 8, pregunta: "Mencione como debe estar vestida la persona que manipula los alimentos." },
    { id: 9, pregunta: "¿Qué son hábitos higiénicos?" },
    { id: 10, pregunta: "¿Qué son hábitos indeseables?" },
    { id: 11, pregunta: "Explique el procedimiento de limpieza y desinfección de los lugares donde se preparan los alimentos." },
    { id: 12, pregunta: "Mencione 4 aspectos claves, antes de preparar alimentos." },
    { id: 13, pregunta: "¿Qué es la contaminación cruzada?" },
    { id: 14, pregunta: "¿Cómo protegemos los alimentos?" },
    { id: 15, pregunta: "Escriba las 10 reglas de oro." }
  ];
  
  // Manejo de archivos
  archivoSeleccionado: File | null = null;
  subiendoArchivo = false;
  errorSubida = '';
  archivoSubido: FileUploadResult | null = null;
  
  // Centro de salud
  centroSeleccionado: number | null = null;
  centrosDeSalud: CentroDeSalud[] = [];
  
  // Estado de la solicitud
  enviandoSolicitud = false;
  errorSolicitud = '';
  solicitudExitosa = false;

  constructor(
    private router: Router,
    private fileUploadService: FileUploadService,
    private authService: AuthService,
    private solicitudTarjetaService: SolicitudTarjetaService,
    private ciudadanoService: CiudadanoService
  ) {
    // Cargar centros de salud
    this.centrosDeSalud = this.solicitudTarjetaService.getCentrosDeSalud();
  }

  ngOnInit(): void {
    this.verificarTarjetasVigentes();
  }

  // Método para seleccionar tipo de tarjeta
  seleccionarTipoTarjeta(tipo: string) {
    console.log('Tipo de tarjeta seleccionado:', tipo);
    
    // Verificar si puede solicitar este tipo de tarjeta
    if (!this.puedesSolicitarTipo(tipo)) {
      let mensaje = '';
      
      if (tipo === 'salud') {
        const fechaVencimiento = this.infoTarjetasVigentes?.proximoVencimiento;
        mensaje = 'No puedes solicitar una Tarjeta de Salud porque ya tienes una vigente.';
        
        if (fechaVencimiento) {
          const fechaFormateada = fechaVencimiento.toLocaleDateString('es-GT', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
          });
          mensaje += ` Tu tarjeta actual vence el ${fechaFormateada}.`;
        }
      } else if (tipo === 'alimentos') {
        // Verificar la razón específica por la que no puede solicitar alimentos
        if (this.tieneTarjetasVigentes) {
          const tipoAlimentos = this.getTipoTarjetaByNumber(2);
          if (this.infoTarjetasVigentes.tipos.includes(tipoAlimentos)) {
            mensaje = 'No puedes solicitar una Tarjeta de Manipulación de Alimentos porque ya tienes una vigente.';
          } else {
            mensaje = 'Para solicitar una Tarjeta de Manipulación de Alimentos, primero debes tener una Tarjeta de Salud aprobada.';
          }
        } else {
          mensaje = 'Para solicitar una Tarjeta de Manipulación de Alimentos, primero debes tener una Tarjeta de Salud aprobada.';
        }
      }
      
      alert(mensaje);
      return;
    }
    
    this.tipoSeleccionado = tipo;
    
    // Resetear estados anteriores
    this.resetearEstados();
    
    if (tipo === 'salud') {
      // Para salud, mostrar sección de archivo
      this.mostrarSeccionArchivo = true;
    } else if (tipo === 'alimentos') {
      // Para alimentos, mostrar sección específica de alimentos
      this.mostrarSeccionAlimentos = true;
    }
  }

  // Método para resetear todos los estados
  private resetearEstados() {
    this.mostrarSeccionArchivo = false;
    this.mostrarSeleccionCentro = false;
    this.mostrarSeccionAlimentos = false;
    this.mostrarModalGuia = false;
    this.mostrarExamen = false;
    this.archivoSeleccionado = null;
    this.archivoSubido = null;
    this.errorSubida = '';
    this.subiendoArchivo = false;
    this.centroSeleccionado = null;
    this.enviandoSolicitud = false;
    this.errorSolicitud = '';
    this.solicitudExitosa = false;
    this.respuestasExamen = {};
    this.examenCompletado = false;
    this.puntajeExamen = 0;
    this.generandoPDF = false;
    this.pdfGenerado = null;
  }

  // Método para manejar selección de archivo
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar el archivo antes de seleccionarlo
      if (!this.fileUploadService.validateFileType(file)) {
        this.errorSubida = 'Tipo de archivo no permitido. Solo se permiten: PDF, DOC, DOCX, JPG, PNG';
        return;
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.errorSubida = 'El archivo es demasiado grande. Tamaño máximo: 10MB';
        return;
      }

      this.archivoSeleccionado = file;
      this.errorSubida = '';
      this.archivoSubido = null;
      console.log('Archivo seleccionado:', file.name);
    }
  }

  // Método para subir archivo a Firebase Storage
  subirArchivo() {
    if (!this.archivoSeleccionado) {
      this.errorSubida = 'No hay archivo seleccionado';
      return;
    }

    this.subiendoArchivo = true;
    this.errorSubida = '';

    // Obtener ID del usuario
    const userId = this.authService.getUserId();
    const folderPath = `solicitudes-tarjetas/${this.tipoSeleccionado}`;
    const userIdString = userId ? userId.toString() : undefined;

    this.fileUploadService.uploadFile(this.archivoSeleccionado, folderPath, userIdString).subscribe({
      next: (result: FileUploadResult) => {
        console.log('Archivo subido exitosamente:', result);
        this.archivoSubido = result;
        this.subiendoArchivo = false;
        
        // Guardar información del archivo en localStorage
        localStorage.setItem('archivoSubido', JSON.stringify(result));
        
        // Continuar automáticamente al siguiente paso
        this.continuarConArchivo();
      },
      error: (error) => {
        console.error('Error al subir archivo:', error);
        this.errorSubida = error.message || 'Error al subir el archivo';
        this.subiendoArchivo = false;
      }
    });
  }

  // Método para proceder al siguiente paso después de subir archivo (solo para salud)
  continuarConArchivo() {
    if (this.archivoSubido && this.tipoSeleccionado === 'salud') {
      this.mostrarSeleccionCentro = true;
    } else {
      this.errorSubida = 'Error: no se pudo procesar el archivo';
    }
  }

  // Método para procesar la solicitud de tarjeta
  procesarSolicitud() {
    if (!this.centroSeleccionado) {
      this.errorSolicitud = 'Por favor selecciona un centro de salud';
      return;
    }

    const ciudadanoId = this.authService.getUserId();
    if (!ciudadanoId) {
      this.errorSolicitud = 'Error: no se pudo obtener la información del usuario';
      return;
    }

    this.enviandoSolicitud = true;
    this.errorSolicitud = '';

    let solicitudData: CreateSolicitudTarjetaDto;

    if (this.tipoSeleccionado === 'salud') {
      if (!this.archivoSubido) {
        this.errorSolicitud = 'Error: no se ha subido el archivo de examen';
        this.enviandoSolicitud = false;
        return;
      }

      solicitudData = this.solicitudTarjetaService.crearSolicitudSalud(
        Number(ciudadanoId),
        this.centroSeleccionado,
        this.archivoSubido.downloadURL
      );
    } else if (this.tipoSeleccionado === 'alimentos') {
      if (!this.pdfGenerado) {
        this.errorSolicitud = 'Error: no se ha generado el PDF del examen';
        this.enviandoSolicitud = false;
        return;
      }

      // Usar el método crearSolicitudSalud pero con el PDF del examen de alimentos
      solicitudData = this.solicitudTarjetaService.crearSolicitudSalud(
        Number(ciudadanoId),
        this.centroSeleccionado,
        this.pdfGenerado.downloadURL
      );
      
      // Cambiar el tipo de tarjeta a manipulación de alimentos (tipo 2)
      solicitudData.tipo_tarjeta = 2;
    } else {
      this.errorSolicitud = 'Error: tipo de tarjeta no válido';
      this.enviandoSolicitud = false;
      return;
    }

    // Validar datos antes de enviar
    const errores = this.solicitudTarjetaService.validarSolicitud(solicitudData);
    if (errores.length > 0) {
      this.errorSolicitud = errores.join(', ');
      this.enviandoSolicitud = false;
      return;
    }

    // Enviar solicitud
    this.solicitudTarjetaService.crearSolicitudTarjeta(solicitudData).subscribe({
      next: (response) => {
        console.log('Solicitud creada exitosamente:', response);
        this.solicitudExitosa = true;
        this.enviandoSolicitud = false;
        
        // Redirigir después de un breve delay
        setTimeout(() => {
          this.router.navigate(['/inicioCiudadano']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error al crear solicitud:', error);
        this.errorSolicitud = error.error?.message || 'Error al procesar la solicitud. Inténtalo de nuevo.';
        this.enviandoSolicitud = false;
      }
    });
  }

  // Método auxiliar para obtener el tamaño formateado del archivo
  getFormattedFileSize(): string {
    if (this.archivoSeleccionado) {
      return this.fileUploadService.formatFileSize(this.archivoSeleccionado.size);
    }
    return '';
  }

  // Método auxiliar para obtener el tamaño formateado del archivo subido
  getFormattedUploadedFileSize(): string {
    if (this.archivoSubido) {
      return this.fileUploadService.formatFileSize(this.archivoSubido.fileSize);
    }
    return '';
  }

  // Método para obtener el nombre del centro de salud seleccionado
  getNombreCentroSeleccionado(): string {
    if (this.centroSeleccionado) {
      const centro = this.solicitudTarjetaService.getCentroDeSaludById(this.centroSeleccionado);
      return centro ? centro.nombre : '';
    }
    return '';
  }

  // Método para volver al paso anterior
  volverPasoAnterior() {
    if (this.mostrarSeleccionCentro) {
      this.mostrarSeleccionCentro = false;
      if (this.tipoSeleccionado === 'salud') {
        this.mostrarSeccionArchivo = true;
      } else if (this.tipoSeleccionado === 'alimentos') {
        this.mostrarExamen = true;
      }
    } else if (this.mostrarExamen) {
      this.volverDelExamen();
    } else if (this.mostrarSeccionArchivo || this.mostrarSeccionAlimentos) {
      this.resetearEstados();
    }
  }

  // Método para eliminar archivo subido
  eliminarArchivo() {
    if (this.archivoSubido) {
      this.fileUploadService.deleteFile(this.archivoSubido.filePath).subscribe({
        next: () => {
          console.log('Archivo eliminado exitosamente');
          this.archivoSubido = null;
          this.archivoSeleccionado = null;
          this.errorSubida = '';
          
          // Limpiar localStorage
          localStorage.removeItem('archivoSubido');
        },
        error: (error) => {
          console.error('Error al eliminar archivo:', error);
          this.errorSubida = 'Error al eliminar el archivo';
        }
      });
    }
  }

  // Método para consultar guía de manipulación de alimentos
  consultarGuia() {
    console.log('Consultando guía de manipulación de alimentos');
    this.mostrarModalGuia = true;
  }

  // Método para cerrar modal de guía
  cerrarModalGuia() {
    this.mostrarModalGuia = false;
  }

  // Método para manejar clics en el backdrop del modal de guía
  onModalGuiaBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.cerrarModalGuia();
    }
  }

  // Método para actualizar respuesta del examen
  actualizarRespuesta(preguntaId: number, respuesta: string) {
    this.respuestasExamen[preguntaId] = respuesta;
  }

  // Método para verificar si todas las preguntas están respondidas
  todasLasPreguntasRespondidas(): boolean {
    return this.preguntasExamen.every(pregunta => 
      this.respuestasExamen[pregunta.id] && 
      this.respuestasExamen[pregunta.id].trim().length > 0
    );
  }

  // Método para enviar examen
  async enviarExamen() {
    if (!this.todasLasPreguntasRespondidas()) {
      alert('Por favor, responde todas las preguntas antes de enviar el examen.');
      return;
    }

    console.log('Enviando examen:', this.respuestasExamen);
    
    // Simular calificación (en un caso real, esto sería evaluado por el backend)
    this.puntajeExamen = this.calcularPuntaje();
    this.examenCompletado = true;
    
    // Si el examen está aprobado, generar PDF y continuar
    if (this.puntajeExamen >= 70) { // 70% mínimo para aprobar
      try {
        // Generar y subir PDF del examen
        await this.subirPDFExamen();
        
        // Continuar con la selección de centro después de subir el PDF
        setTimeout(() => {
          this.mostrarExamen = false;
          this.mostrarSeleccionCentro = true;
        }, 2000);
      } catch (error) {
        console.error('Error al generar/subir PDF del examen:', error);
        alert('Error al procesar el examen. Por favor, inténtalo de nuevo.');
        this.examenCompletado = false;
      }
    }
  }

  // Método para calcular puntaje (simulado)
  private calcularPuntaje(): number {
    // En un caso real, aquí se evaluarían las respuestas contra las correctas
    // Por ahora, simularemos un puntaje aleatorio entre 70-100
    return Math.floor(Math.random() * 31) + 70;
  }

  // Método para volver del examen
  volverDelExamen() {
    this.mostrarExamen = false;
    this.mostrarSeccionAlimentos = true;
    this.respuestasExamen = {};
    this.examenCompletado = false;
    this.puntajeExamen = 0;
    this.generandoPDF = false;
    this.pdfGenerado = null;
  }

  // Método para generar PDF con las respuestas del examen
  private async generarPDFExamen(): Promise<Blob> {
    const doc = new jsPDF();
    
    // Obtener información del usuario
    const userId = this.authService.getUserId();
    const token = localStorage.getItem('token');
    let userData: any = null;
    
    if (token) {
      try {
        userData = this.authService.decodeToken(token);
      } catch (error) {
        console.warn('Error al decodificar token:', error);
      }
    }
    
    // Configurar fuente y estilo
    doc.setFont('helvetica');
    
    // Título del documento
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EXAMEN DE MANIPULACIÓN DE ALIMENTOS', 105, 20, { align: 'center' });
    
    // Información del usuario
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Usuario ID: ${userId}`, 20, 35);
    doc.text(`Nombre: ${userData?.['nombre'] || 'N/A'}`, 20, 45);
    doc.text(`Email: ${userData?.['email'] || 'N/A'}`, 20, 55);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 20, 65);
    doc.text(`Puntaje: ${this.puntajeExamen}%`, 20, 75);
    doc.text(`Estado: ${this.puntajeExamen >= 70 ? 'APROBADO' : 'REPROBADO'}`, 20, 85);
    
    // Línea separadora
    doc.line(20, 95, 190, 95);
    
    let yPosition = 105;
    
    // Agregar cada pregunta y respuesta
    this.preguntasExamen.forEach((pregunta, index) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Pregunta
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const preguntaText = `${pregunta.id}. ${pregunta.pregunta}`;
      const preguntaLines = doc.splitTextToSize(preguntaText, 170);
      doc.text(preguntaLines, 20, yPosition);
      yPosition += preguntaLines.length * 6;
      
      // Respuesta
      doc.setFont('helvetica', 'normal');
      const respuesta = this.respuestasExamen[pregunta.id] || 'Sin respuesta';
      const respuestaLines = doc.splitTextToSize(`R: ${respuesta}`, 170);
      doc.text(respuestaLines, 20, yPosition);
      yPosition += respuestaLines.length * 6 + 10;
    });
    
    // Agregar pie de página
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
      doc.text('Sistema de Solicitud de Tarjetas - MSPAS', 105, 285, { align: 'center' });
    }
    
    return doc.output('blob');
  }

  // Método para subir PDF a Firebase Storage
  private async subirPDFExamen(): Promise<FileUploadResult> {
    this.generandoPDF = true;
    
    try {
      // Generar el PDF
      const pdfBlob = await this.generarPDFExamen();
      
      // Crear un File objeto desde el Blob
      const userId = this.authService.getUserId();
      const timestamp = new Date().getTime();
      const fileName = `examen_manipulacion_alimentos_${userId}_${timestamp}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      // Subir a Firebase Storage
      const folderPath = 'solicitudes-tarjetas/manipulacion-alimentos';
      const userIdString = userId ? userId.toString() : undefined;
      
      return new Promise((resolve, reject) => {
        this.fileUploadService.uploadFile(pdfFile, folderPath, userIdString).subscribe({
          next: (result: FileUploadResult) => {
            console.log('PDF del examen subido exitosamente:', result);
            this.pdfGenerado = result;
            this.generandoPDF = false;
            resolve(result);
          },
          error: (error) => {
            console.error('Error al subir PDF del examen:', error);
            this.generandoPDF = false;
            reject(error);
          }
        });
      });
    } catch (error) {
      this.generandoPDF = false;
      throw error;
    }
  }

  // Método para verificar tarjetas vigentes del usuario
  private verificarTarjetasVigentes(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.ciudadanoService.getTarjetas(Number(userId)).subscribe({
        next: (tarjetas: tarjeta[]) => {
          this.tarjetasUsuario = tarjetas;
          this.tieneTarjetasVigentes = this.tieneTrietasAprobadasVigentes();
          this.infoTarjetasVigentes = this.getInfoTarjetasVigentes();
          
          console.log('📋 Tarjetas del usuario cargadas:', this.tarjetasUsuario);
          console.log('🏥 Tiene tarjeta de salud aprobada:', this.tieneTarjetaDeSaludAprobada());
          console.log('✅ Puede solicitar tarjeta de salud:', this.puedesSolicitarTipo('salud'));
          console.log('🍽️ Puede solicitar tarjeta de alimentos:', this.puedesSolicitarTipo('alimentos'));
          
          if (this.tieneTarjetasVigentes) {
            console.log('⚠️ Usuario tiene tarjetas vigentes:', this.infoTarjetasVigentes);
          }
        },
        error: (error: any) => {
          console.error('Error al cargar tarjetas del usuario:', error);
          console.log('🔄 Creando datos de prueba para demostrar funcionalidad...');
          
          // Datos de prueba para demostrar la funcionalidad
          // Escenario: Usuario con tarjeta de salud vigente (para probar restricción)
          this.tarjetasUsuario = [
            {
              id_tarjeta: 1,
              id_solicitud: 1,
              fecha_emision: new Date('2025-01-01'), // Vigente
              fecha_vencimiento: new Date('2026-01-01'), // Vigente hasta el próximo año
              estado: 2, // Aprobada
              solicitud_tarjeta: {
                id_centro_de_salud: 1,
                id_ciudadano: Number(userId),
                fecha_solicitud: '2025-01-01T00:00:00.000Z',
                tipo_tarjeta: 1, // Salud
                estado: 2, // Aprobada
                usuario: {
                  nombres: 'Usuario',
                  apellidos: 'Demo',
                  cui: '1234567890123',
                  email: 'demo@email.com',
                  telefono: '12345678'
                }
              }
            }
          ];
          
          this.tieneTarjetasVigentes = this.tieneTrietasAprobadasVigentes();
          this.infoTarjetasVigentes = this.getInfoTarjetasVigentes();
          
          console.log('📋 Datos de prueba creados:', this.tarjetasUsuario);
          console.log('🏥 Tiene tarjeta de salud aprobada:', this.tieneTarjetaDeSaludAprobada());
          console.log('✅ Puede solicitar tarjeta de salud:', this.puedesSolicitarTipo('salud'));
          console.log('🍽️ Puede solicitar tarjeta de alimentos:', this.puedesSolicitarTipo('alimentos'));
        }
      });
    }
  }

  // Método para verificar si el usuario tiene tarjetas aprobadas vigentes
  private tieneTrietasAprobadasVigentes(): boolean {
    if (!this.tarjetasUsuario || this.tarjetasUsuario.length === 0) {
      return false;
    }

    const tarjetasAprobadas = this.tarjetasUsuario.filter(tarjeta => {
      const estado = tarjeta.estado || tarjeta.solicitud_tarjeta?.estado || tarjeta.solicitud?.estado;
      return estado === 2; // Estado 2 = Aprobada
    });

    if (tarjetasAprobadas.length === 0) {
      return false;
    }

    // Verificar si alguna tarjeta está vigente
    const fechaActual = new Date();
    
    return tarjetasAprobadas.some(tarjeta => {
      // Si tiene fecha de vencimiento, verificar que no haya vencido
      if (tarjeta.fecha_vencimiento) {
        const fechaVencimiento = new Date(tarjeta.fecha_vencimiento);
        return fechaVencimiento > fechaActual;
      }
      
      // Si no tiene fecha de vencimiento pero tiene fecha de emisión, 
      // asumir vigencia de 1 año desde la emisión
      if (tarjeta.fecha_emision) {
        const fechaEmision = new Date(tarjeta.fecha_emision);
        const fechaVencimientoCalculada = new Date(fechaEmision);
        fechaVencimientoCalculada.setFullYear(fechaVencimientoCalculada.getFullYear() + 1);
        return fechaVencimientoCalculada > fechaActual;
      }
      
      // Si no tiene fechas, considerar como vigente (por seguridad)
      return true;
    });
  }

  // Método para obtener información sobre las tarjetas vigentes
  private getInfoTarjetasVigentes(): { 
    cantidad: number, 
    tipos: string[], 
    proximoVencimiento: Date | null 
  } {
    const tarjetasAprobadas = this.tarjetasUsuario.filter(tarjeta => {
      const estado = tarjeta.estado || tarjeta.solicitud_tarjeta?.estado || tarjeta.solicitud?.estado;
      return estado === 2; // Estado 2 = Aprobada
    });

    const fechaActual = new Date();
    const tarjetasVigentes = tarjetasAprobadas.filter(tarjeta => {
      if (tarjeta.fecha_vencimiento) {
        const fechaVencimiento = new Date(tarjeta.fecha_vencimiento);
        return fechaVencimiento > fechaActual;
      }
      
      if (tarjeta.fecha_emision) {
        const fechaEmision = new Date(tarjeta.fecha_emision);
        const fechaVencimientoCalculada = new Date(fechaEmision);
        fechaVencimientoCalculada.setFullYear(fechaVencimientoCalculada.getFullYear() + 1);
        return fechaVencimientoCalculada > fechaActual;
      }
      
      return true;
    });

    // Obtener tipos de tarjetas vigentes
    const tipos = tarjetasVigentes.map(tarjeta => this.getTipoTarjeta(tarjeta));
    const tiposUnicos = [...new Set(tipos)];

    // Encontrar el próximo vencimiento
    let proximoVencimiento: Date | null = null;
    
    tarjetasVigentes.forEach(tarjeta => {
      let fechaVencimiento: Date | null = null;
      
      if (tarjeta.fecha_vencimiento) {
        fechaVencimiento = new Date(tarjeta.fecha_vencimiento);
      } else if (tarjeta.fecha_emision) {
        const fechaEmision = new Date(tarjeta.fecha_emision);
        fechaVencimiento = new Date(fechaEmision);
        fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
      }
      
      if (fechaVencimiento && (!proximoVencimiento || fechaVencimiento < proximoVencimiento)) {
        proximoVencimiento = fechaVencimiento;
      }
    });

    return {
      cantidad: tarjetasVigentes.length,
      tipos: tiposUnicos,
      proximoVencimiento
    };
  }

  // Método auxiliar para obtener el tipo de tarjeta
  private getTipoTarjeta(tarjeta: tarjeta): string {
    const tipo = tarjeta.solicitud_tarjeta?.tipo_tarjeta || tarjeta.solicitud?.tipo_tarjeta || tarjeta.tipo_tarjeta;
    switch (tipo) {
      case 1: return 'Tarjeta de Salud';
      case 2: return 'Tarjeta de Manipulación de Alimentos';
      default: return 'Tarjeta Desconocida';
    }
  }

  // Método para verificar si puede solicitar un tipo específico de tarjeta
  puedesSolicitarTipo(tipo: string): boolean {
    console.log(`🔍 Verificando si puede solicitar tarjeta de ${tipo}`);
    console.log('📋 Tarjetas usuario:', this.tarjetasUsuario);
    console.log('⚡ Tiene tarjetas vigentes:', this.tieneTarjetasVigentes);
    console.log('📊 Info tarjetas vigentes:', this.infoTarjetasVigentes);
    
    // Para tarjetas de salud, verificar que no tenga una vigente del mismo tipo
    if (tipo === 'salud') {
      if (!this.tieneTarjetasVigentes) {
        console.log('✅ No tiene tarjetas vigentes, puede solicitar salud');
        return true; // Si no tiene tarjetas vigentes, puede solicitar salud
      }
      
      const tipoSolicitado = this.getTipoTarjetaByNumber(1);
      const tieneSaludVigente = this.infoTarjetasVigentes.tipos.includes(tipoSolicitado);
      console.log(`🏥 Tipo solicitado: ${tipoSolicitado}`);
      console.log(`🏥 Tiene salud vigente: ${tieneSaludVigente}`);
      
      // No puede solicitar si ya tiene una tarjeta de salud vigente
      return !tieneSaludVigente;
    }
    
    // Para tarjetas de manipulación de alimentos, debe tener una tarjeta de salud aprobada
    if (tipo === 'alimentos') {
      // Primero verificar que no tenga ya una tarjeta de alimentos vigente
      if (this.tieneTarjetasVigentes) {
        const tipoAlimentos = this.getTipoTarjetaByNumber(2);
        const tieneAlimentosVigente = this.infoTarjetasVigentes.tipos.includes(tipoAlimentos);
        console.log(`🍽️ Tiene alimentos vigente: ${tieneAlimentosVigente}`);
        
        if (tieneAlimentosVigente) {
          console.log('❌ Ya tiene una tarjeta de alimentos vigente');
          return false; // Ya tiene una tarjeta de alimentos vigente
        }
      }
      
      // Verificar que tenga una tarjeta de salud aprobada (vigente o no)
      const tieneSaludAprobada = this.tieneTarjetaDeSaludAprobada();
      console.log(`🏥 Tiene tarjeta de salud aprobada: ${tieneSaludAprobada}`);
      
      return tieneSaludAprobada;
    }
    
    return false;
  }

  // Método auxiliar para obtener el nombre del tipo por número
  private getTipoTarjetaByNumber(tipo: number): string {
    switch (tipo) {
      case 1: return 'Tarjeta de Salud';
      case 2: return 'Tarjeta de Manipulación de Alimentos';
      default: return 'Tarjeta Desconocida';
    }
  }

  // Método para verificar si el usuario tiene una tarjeta de salud aprobada (vigente o no)
  tieneTarjetaDeSaludAprobada(): boolean {
    if (!this.tarjetasUsuario || this.tarjetasUsuario.length === 0) {
      return false;
    }

    // Buscar tarjetas de salud aprobadas (tipo 1, estado 2)
    const tarjetasDeSaludAprobadas = this.tarjetasUsuario.filter(tarjeta => {
      const tipo = tarjeta.solicitud_tarjeta?.tipo_tarjeta || tarjeta.solicitud?.tipo_tarjeta || tarjeta.tipo_tarjeta;
      const estado = tarjeta.estado || tarjeta.solicitud_tarjeta?.estado || tarjeta.solicitud?.estado;
      
      return tipo === 1 && estado === 2; // Tipo 1 = Salud, Estado 2 = Aprobada
    });

    return tarjetasDeSaludAprobadas.length > 0;
  }

  // Método para obtener el mensaje apropiado para el overlay de tarjeta de alimentos
  getMensajeOverlayAlimentos(): string {
    if (this.tieneTarjetasVigentes && this.infoTarjetasVigentes?.tipos.includes('Tarjeta de Manipulación de Alimentos')) {
      return 'Ya tienes una\ntarjeta vigente';
    }
    
    if (!this.tieneTarjetaDeSaludAprobada()) {
      return 'Requiere tarjeta\nde salud aprobada';
    }
    
    return 'No disponible';
  }

  // Método para iniciar examen de manipulación de alimentos
  iniciarExamen() {
    console.log('Iniciando examen de manipulación de alimentos');
    this.mostrarSeccionAlimentos = false;
    this.mostrarExamen = true;
  }

  // Método de prueba para cambiar escenarios (para testing - se puede remover en producción)
  cambiarEscenarioPrueba(escenario: string) {
    const userId = this.authService.getUserId();
    
    switch (escenario) {
      case 'sin-tarjetas':
        this.tarjetasUsuario = [];
        break;
        
      case 'salud-vigente':
        this.tarjetasUsuario = [
          {
            id_tarjeta: 1,
            id_solicitud: 1,
            fecha_emision: new Date('2025-01-01'),
            fecha_vencimiento: new Date('2026-01-01'),
            estado: 2,
            solicitud_tarjeta: {
              id_centro_de_salud: 1,
              id_ciudadano: Number(userId),
              fecha_solicitud: '2025-01-01T00:00:00.000Z',
              tipo_tarjeta: 1, // Salud
              estado: 2,
              usuario: { nombres: 'Usuario', apellidos: 'Demo', cui: '1234567890123', email: 'demo@email.com', telefono: '12345678' }
            }
          }
        ];
        break;
        
      case 'salud-vencida':
        this.tarjetasUsuario = [
          {
            id_tarjeta: 1,
            id_solicitud: 1,
            fecha_emision: new Date('2023-01-01'),
            fecha_vencimiento: new Date('2024-01-01'),
            estado: 2,
            solicitud_tarjeta: {
              id_centro_de_salud: 1,
              id_ciudadano: Number(userId),
              fecha_solicitud: '2023-01-01T00:00:00.000Z',
              tipo_tarjeta: 1, // Salud
              estado: 2,
              usuario: { nombres: 'Usuario', apellidos: 'Demo', cui: '1234567890123', email: 'demo@email.com', telefono: '12345678' }
            }
          }
        ];
        break;
        
      case 'ambas-vigentes':
        this.tarjetasUsuario = [
          {
            id_tarjeta: 1,
            id_solicitud: 1,
            fecha_emision: new Date('2025-01-01'),
            fecha_vencimiento: new Date('2026-01-01'),
            estado: 2,
            solicitud_tarjeta: {
              id_centro_de_salud: 1,
              id_ciudadano: Number(userId),
              fecha_solicitud: '2025-01-01T00:00:00.000Z',
              tipo_tarjeta: 1, // Salud
              estado: 2,
              usuario: { nombres: 'Usuario', apellidos: 'Demo', cui: '1234567890123', email: 'demo@email.com', telefono: '12345678' }
            }
          },
          {
            id_tarjeta: 2,
            id_solicitud: 2,
            fecha_emision: new Date('2025-02-01'),
            fecha_vencimiento: new Date('2026-02-01'),
            estado: 2,
            solicitud_tarjeta: {
              id_centro_de_salud: 1,
              id_ciudadano: Number(userId),
              fecha_solicitud: '2025-02-01T00:00:00.000Z',
              tipo_tarjeta: 2, // Alimentos
              estado: 2,
              usuario: { nombres: 'Usuario', apellidos: 'Demo', cui: '1234567890123', email: 'demo@email.com', telefono: '12345678' }
            }
          }
        ];
        break;
    }
    
    // Recalcular después del cambio
    this.tieneTarjetasVigentes = this.tieneTrietasAprobadasVigentes();
    this.infoTarjetasVigentes = this.getInfoTarjetasVigentes();
    
    console.log(`🔄 Escenario cambiado a: ${escenario}`);
    console.log('📋 Nuevas tarjetas:', this.tarjetasUsuario);
    console.log('🏥 Tiene tarjeta de salud aprobada:', this.tieneTarjetaDeSaludAprobada());
    console.log('✅ Puede solicitar tarjeta de salud:', this.puedesSolicitarTipo('salud'));
    console.log('🍽️ Puede solicitar tarjeta de alimentos:', this.puedesSolicitarTipo('alimentos'));
  }

}
