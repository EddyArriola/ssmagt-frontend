import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Tarjeta } from '../interfaces/tarjeta';
import { QrCodeService, QRCodeData } from './qr-code.service';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor(private qrCodeService: QrCodeService) { }

  /**
   * Genera y descarga una constancia de tarjeta de salud en formato PDF
   */
  async generarConstanciaTarjeta(tarjeta: Tarjeta): Promise<void> {
    try {
      // Crear nuevo documento PDF
      const doc = new jsPDF('p', 'mm', 'letter');
      
      // Configurar fuentes
      doc.setFont('helvetica');
      
      // Obtener datos de la tarjeta
      const ciudadano = tarjeta.solicitud_tarjeta?.usuario;
      const fechaEmision = new Date(tarjeta.fecha_emision);
      const fechaVencimiento = new Date(tarjeta.fecha_vencimiento);
      const tipoTarjeta = this.obtenerTipoTarjeta(tarjeta.solicitud_tarjeta?.tipo_tarjeta);
      const cui = ciudadano?.cui || '';
      const nombreCompleto = `${ciudadano?.nombres || ''} ${ciudadano?.apellidos || ''}`.trim();

      // Generar código QR
      const qrData: QRCodeData = {
        id_tarjeta: tarjeta.id_tarjeta,
        id_solicitud: tarjeta.id_solicitud || 0,
        cui_ciudadano: cui,
        tipo_tarjeta: tarjeta.solicitud_tarjeta?.tipo_tarjeta || 1,
        fecha_emision: tarjeta.fecha_emision,
        fecha_vencimiento: tarjeta.fecha_vencimiento,
        centro_salud: tarjeta.solicitud_tarjeta?.id_centro_de_salud || 0,
        estado: tarjeta.estado
      };
      
      const qrCodeDataUrl = await this.qrCodeService.generateQRCode(qrData, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Configurar diseño
      this.dibujarEncabezado(doc);
      await this.dibujarCuerpoConstancia(doc, {
        nombreCompleto,
        cui,
        tipoTarjeta,
        fechaEmision,
        fechaVencimiento,
        numeroTarjeta: tarjeta.id_tarjeta?.toString() || '',
        numeroSolicitud: tarjeta.id_solicitud?.toString() || '',
        qrCodeDataUrl
      });
      this.dibujarPie(doc, fechaEmision);

      // Generar nombre del archivo
      const nombreArchivo = `Constancia_Tarjeta_${cui}_${this.formatearFechaArchivo(new Date())}.pdf`;
      
      // Descargar el PDF
      doc.save(nombreArchivo);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw error;
    }
  }

  /**
   * Dibuja el encabezado del documento
   */
  private dibujarEncabezado(doc: jsPDF): void {
    // Logo izquierdo (simulado con texto)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('MINISTERIO DE SALUD PÚBLICA', 20, 25);
    doc.text('Y ASISTENCIA SOCIAL', 20, 30);
    
    // Logo derecho (simulado con texto)
    doc.text('GUATEMALA', 160, 25);
    doc.text('GOBIERNO', 160, 30);

    // Título principal
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ministerio de Salud Pública y Asistencia Social', 105, 50, { align: 'center' });
    doc.text('Dirección General del Sistema Integral de Atención en Salud', 105, 57, { align: 'center' });

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 65, 195, 65);

    // Título del área de salud
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DIRECCIÓN DE AREA DE SALUD "GUATEMALA CENTRAL"', 105, 75, { align: 'center' });
    doc.setFontSize(10);
    doc.text('No.', 180, 82);

    // Distrito Municipal
    doc.setFontSize(11);
    doc.text('DISTRITO MUNICIPAL DE SALUD DE', 20, 92);
    
    // Título de la tarjeta
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TARJETA DE SALUD', 105, 105, { align: 'center' });
  }

  /**
   * Dibuja el cuerpo principal de la constancia
   */
  private async dibujarCuerpoConstancia(doc: jsPDF, datos: any): Promise<void> {
    let yPosition = 120;

    // Descripción del documento
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const descripcion = `El infrascrito Coordinador del Distrito Municipal, con base a los exámenes que le practicaron a:`;
    doc.text(descripcion, 20, yPosition);
    
    yPosition += 15;

    // Línea para el nombre
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, 195, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(datos.nombreCompleto.toUpperCase(), 105, yPosition - 3, { align: 'center' });
    
    yPosition += 15;

    // CUI
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Código Único de Identificación:', 20, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(datos.cui, 90, yPosition);
    
    yPosition += 15;

    // Declaración de salud
    doc.setFont('helvetica', 'normal');
    const declaracion = `Extiende el presente documento, por no padecer de alguna enfermedad transmisible`;
    doc.text(declaracion, 20, yPosition);
    yPosition += 8;
    doc.text('de acuerdo a las disposiciones de conformidad con la normativa respectiva.', 20, yPosition);

    yPosition += 20;

    // Información de emisión
    doc.text(`Guatemala, `, 20, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(`${datos.fechaEmision.getDate()}`, 50, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(' de ', 60, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(this.obtenerNombreMes(datos.fechaEmision.getMonth()), 75, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(', 20', 115, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(`${datos.fechaEmision.getFullYear().toString().slice(-2)}`, 130, yPosition);

    yPosition += 15;

    // Validez del documento
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DOCUMENTO VÁLIDO POR UN AÑO A PARTIR DE ESTA FECHA', 105, yPosition, { align: 'center' });

    yPosition += 25;

    // Espacio para firma
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Nombre y firma del Funcionario que autoriza y sello del Distrito:', 20, yPosition);
    
    // Línea para la firma
    yPosition += 20;
    doc.line(20, yPosition, 120, yPosition);

    // Información de contacto
    yPosition += 15;
    doc.setFontSize(8);
    doc.text('Cualquier Anomalía, Comunicarse al teléfono: (número telefónico de la Dirección del Área de Salud)', 20, yPosition);

    // Área para foto
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.rect(150, 120, 40, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('FOTO', 170, 148, { align: 'center' });

    // Información adicional de la tarjeta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPosition += 15;
    doc.text(`Tipo de Tarjeta: ${datos.tipoTarjeta}`, 20, yPosition);
    yPosition += 5;
    doc.text(`No. Tarjeta: ${datos.numeroTarjeta.padStart(6, '0')}`, 20, yPosition);
    yPosition += 5;
    doc.text(`No. Solicitud: ${datos.numeroSolicitud.padStart(6, '0')}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Fecha de Vencimiento: ${this.formatearFecha(datos.fechaVencimiento)}`, 20, yPosition);

    // Agregar código QR en la parte inferior
    if (datos.qrCodeDataUrl) {
      yPosition += 20;
      
      // Título del QR
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Código QR de Verificación:', 20, yPosition);
      
      // Agregar el QR como imagen
      try {
        const qrSize = 30; // Tamaño del QR en mm
        doc.addImage(datos.qrCodeDataUrl, 'PNG', 20, yPosition + 5, qrSize, qrSize);
        
        // Texto explicativo al lado del QR
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Escanea este código para verificar', 55, yPosition + 15);
        doc.text('la autenticidad de esta constancia', 55, yPosition + 20);
        doc.text('en el sistema digital del MSPAS', 55, yPosition + 25);
      } catch (error) {
        console.warn('No se pudo agregar el QR al PDF:', error);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Código QR no disponible', 20, yPosition + 10);
      }
    }
  }

  /**
   * Dibuja el pie del documento
   */
  private dibujarPie(doc: jsPDF, fechaEmision: Date): void {
    // Pie de página
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Documento generado digitalmente por el Sistema de Gestión de Tarjetas', 105, 270, { align: 'center' });
    doc.text(`Fecha de generación: ${this.formatearFechaCompleta(new Date())}`, 105, 275, { align: 'center' });
  }

  /**
   * Obtiene el tipo de tarjeta en texto
   */
  private obtenerTipoTarjeta(tipo: number | undefined): string {
    switch (tipo) {
      case 1:
        return 'TARJETA DE SALUD';
      case 2:
        return 'TARJETA DE MANIPULACIÓN';
      default:
        return 'TARJETA DE SALUD';
    }
  }

  /**
   * Obtiene el nombre del mes
   */
  private obtenerNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes] || '';
  }

  /**
   * Formatea fecha para mostrar
   */
  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formatea fecha completa para mostrar
   */
  private formatearFechaCompleta(fecha: Date): string {
    return fecha.toLocaleString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatea fecha para nombre de archivo
   */
  private formatearFechaArchivo(fecha: Date): string {
    return fecha.toISOString().slice(0, 10).replace(/-/g, '');
  }
}