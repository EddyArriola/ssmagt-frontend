import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

export interface QRCodeData {
  id_tarjeta: number;
  id_solicitud?: number;
  cui_ciudadano?: string;
  tipo_tarjeta: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  centro_salud: number;
  estado: number;
}

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {

  constructor() { }

  /**
   * Genera un código QR para una tarjeta
   * @param tarjetaData Datos de la tarjeta para incluir en el QR
   * @param options Opciones de configuración del QR
   * @returns Promise con la URL de la imagen del QR en base64
   */
  async generateQRCode(
    tarjetaData: QRCodeData, 
    options?: {
      width?: number;
      margin?: number;
      color?: {
        dark?: string;
        light?: string;
      };
    }
  ): Promise<string> {
    try {
      // Crear el objeto de datos que irá en el QR
      const qrData = {
        id_tarjeta: tarjetaData.id_tarjeta,
        id_solicitud: tarjetaData.id_solicitud || 0,
        cui_ciudadano: tarjetaData.cui_ciudadano,
        tipo_tarjeta: tarjetaData.tipo_tarjeta,
        fecha_emision: tarjetaData.fecha_emision,
        fecha_vencimiento: tarjetaData.fecha_vencimiento,
        centro_salud: tarjetaData.centro_salud,
        estado: tarjetaData.estado,
        timestamp: new Date().toISOString()
      };

      // Convertir a JSON string
      const dataString = JSON.stringify(qrData);

      // Opciones por defecto
      const qrOptions = {
        width: options?.width || 200,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || '#000000',
          light: options?.color?.light || '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const
      };

      // Generar el código QR
      const qrCodeDataURL = await QRCode.toDataURL(dataString, qrOptions);
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generando código QR:', error);
      throw new Error('No se pudo generar el código QR');
    }
  }

  /**
   * Genera un código QR simple con solo el ID de la tarjeta
   * @param idTarjeta ID de la tarjeta
   * @param options Opciones de configuración
   * @returns Promise con la URL de la imagen del QR
   */
  async generateSimpleQRCode(
    idTarjeta: number,
    options?: {
      width?: number;
      margin?: number;
    }
  ): Promise<string> {
    try {
      const dataString = `TARJETA_SALUD_${idTarjeta}`;
      
      const qrOptions = {
        width: options?.width || 150,
        margin: options?.margin || 2,
        color: {
          dark: '#7db4a6',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const
      };

      const qrCodeDataURL = await QRCode.toDataURL(dataString, qrOptions);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generando código QR simple:', error);
      throw new Error('No se pudo generar el código QR');
    }
  }

  /**
   * Genera un código QR para verificación online
   * @param idTarjeta ID de la tarjeta
   * @param baseUrl URL base del sistema (opcional)
   * @returns Promise con la URL de la imagen del QR
   */
  async generateVerificationQRCode(
    idTarjeta: number,
    baseUrl: string = 'https://salud.gt/verificar'
  ): Promise<string> {
    try {
      const verificationUrl = `${baseUrl}/tarjeta/${idTarjeta}`;
      
      const qrOptions = {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' as const
      };

      const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, qrOptions);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generando código QR de verificación:', error);
      throw new Error('No se pudo generar el código QR de verificación');
    }
  }

  /**
   * Decodifica los datos de un código QR (para verificación)
   * @param qrDataString String de datos del QR
   * @returns Objeto con los datos decodificados o null si es inválido
   */
  decodeQRData(qrDataString: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrDataString);
      
      // Validar que tenga los campos mínimos requeridos
      if (data.id_tarjeta && data.tipo_tarjeta && data.fecha_emision) {
        return data as QRCodeData;
      }
      
      return null;
    } catch (error) {
      console.error('Error decodificando datos del QR:', error);
      return null;
    }
  }

  /**
   * Valida si un código QR corresponde a una tarjeta válida
   * @param qrData Datos decodificados del QR
   * @returns boolean indicando si la tarjeta es válida
   */
  validateQRCode(qrData: QRCodeData): boolean {
    try {
      // Verificar que no esté vencida
      const fechaVencimiento = new Date(qrData.fecha_vencimiento);
      const fechaActual = new Date();
      
      if (fechaVencimiento < fechaActual) {
        return false; // Tarjeta vencida
      }

      // Verificar que esté activa
      if (qrData.estado !== 2) { // 2 = aprobada/activa
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validando código QR:', error);
      return false;
    }
  }

  /**
   * Genera un código QR optimizado para móvil con mayor resolución
   * @param tarjetaData Datos de la tarjeta
   * @returns Promise con URL del QR en alta resolución
   */
  async generateMobileQRCode(tarjetaData: QRCodeData): Promise<string> {
    try {
      const qrData = {
        id_tarjeta: tarjetaData.id_tarjeta,
        id_solicitud: tarjetaData.id_solicitud || 0,
        cui_ciudadano: tarjetaData.cui_ciudadano,
        tipo_tarjeta: tarjetaData.tipo_tarjeta,
        fecha_emision: tarjetaData.fecha_emision,
        fecha_vencimiento: tarjetaData.fecha_vencimiento,
        centro_salud: tarjetaData.centro_salud,
        estado: tarjetaData.estado,
        timestamp: new Date().toISOString(),
        mobile: true // Indicador para QR móvil
      };

      const dataString = JSON.stringify(qrData);

      // Configuración optimizada para móvil
      const qrOptions = {
        width: 512, // Mayor resolución para móvil
        margin: 4,
        color: {
          dark: '#1f2937',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' as const // Máxima corrección de errores
      };

      const qrCodeDataURL = await QRCode.toDataURL(dataString, qrOptions);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generando código QR móvil:', error);
      throw new Error('No se pudo generar el código QR móvil');
    }
  }

  /**
   * Descargar el código QR como imagen
   * @param qrDataURL URL del QR en base64
   * @param filename Nombre del archivo (opcional)
   */
  downloadQRCode(qrDataURL: string, filename: string = 'tarjeta_qr.png'): void {
    try {
      const link = document.createElement('a');
      link.download = filename;
      link.href = qrDataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error descargando código QR:', error);
    }
  }

  /**
   * Descargar QR optimizado para móvil con información adicional
   * @param tarjetaData Datos de la tarjeta
   * @param nombreCiudadano Nombre del ciudadano (opcional)
   */
  async downloadMobileQRCode(tarjetaData: QRCodeData, nombreCiudadano?: string): Promise<void> {
    try {
      const mobileQR = await this.generateMobileQRCode(tarjetaData);
      
      // Generar nombre de archivo descriptivo
      const tipoTarjeta = tarjetaData.tipo_tarjeta === 1 ? 'salud' : 'manipulacion';
      const fechaEmision = new Date(tarjetaData.fecha_emision).toISOString().split('T')[0];
      const nombreArchivo = nombreCiudadano 
        ? `${nombreCiudadano.replace(/\s+/g, '_')}_tarjeta_${tipoTarjeta}_${fechaEmision}_QR_mobile.png`
        : `tarjeta_${tarjetaData.id_tarjeta}_${tipoTarjeta}_${fechaEmision}_QR_mobile.png`;

      this.downloadQRCode(mobileQR, nombreArchivo);
    } catch (error) {
      console.error('Error descargando QR móvil:', error);
      throw error;
    }
  }

  /**
   * Copiar QR al portapapeles (para compartir fácilmente)
   * @param qrDataURL URL del QR en base64
   */
  async copyQRToClipboard(qrDataURL: string): Promise<void> {
    try {
      // Convertir data URL a blob
      const response = await fetch(qrDataURL);
      const blob = await response.blob();
      
      // Crear ClipboardItem
      const clipboardItem = new ClipboardItem({ 'image/png': blob });
      
      // Copiar al portapapeles
      await navigator.clipboard.write([clipboardItem]);
      
      console.log('QR copiado al portapapeles');
    } catch (error) {
      console.error('Error copiando QR al portapapeles:', error);
      // Fallback: mostrar mensaje al usuario
      throw new Error('No se pudo copiar al portapapeles. Tu navegador puede no soportar esta función.');
    }
  }

  /**
   * Compartir QR usando Web Share API (ideal para móvil)
   * @param qrDataURL URL del QR
   * @param tarjetaInfo Información de la tarjeta para el mensaje
   */
  async shareQRCode(qrDataURL: string, tarjetaInfo: { tipo: string; id: number }): Promise<void> {
    try {
      if (!navigator.share) {
        throw new Error('Web Share API no disponible');
      }

      // Convertir data URL a File
      const response = await fetch(qrDataURL);
      const blob = await response.blob();
      const file = new File([blob], `tarjeta_${tarjetaInfo.id}_qr.png`, { type: 'image/png' });

      await navigator.share({
        title: `Código QR - ${tarjetaInfo.tipo}`,
        text: `Código QR de mi ${tarjetaInfo.tipo} #${tarjetaInfo.id}`,
        files: [file]
      });

      console.log('QR compartido exitosamente');
    } catch (error) {
      console.error('Error compartiendo QR:', error);
      throw error;
    }
  }

  /**
   * Generar QR con formato de tarjeta digital (incluye más información visual)
   * @param tarjetaData Datos de la tarjeta
   * @param ciudadanoInfo Información del ciudadano
   */
  async generateDigitalCardQR(
    tarjetaData: QRCodeData, 
    ciudadanoInfo: { nombres: string; apellidos: string; cui?: string }
  ): Promise<string> {
    try {
      // Crear datos enriquecidos para tarjeta digital
      const digitalCardData = {
        version: '1.0',
        tipo: 'TARJETA_SALUD_DIGITAL',
        tarjeta: {
          id: tarjetaData.id_tarjeta,
          tipo: tarjetaData.tipo_tarjeta,
          estado: tarjetaData.estado,
          emision: tarjetaData.fecha_emision,
          vencimiento: tarjetaData.fecha_vencimiento
        },
        ciudadano: {
          nombres: ciudadanoInfo.nombres,
          apellidos: ciudadanoInfo.apellidos,
          cui: ciudadanoInfo.cui
        },
        centro: tarjetaData.centro_salud,
        timestamp: new Date().toISOString(),
        verificacion_url: `https://salud.gt/verificar/${tarjetaData.id_tarjeta}`
      };

      const dataString = JSON.stringify(digitalCardData);

      const qrOptions = {
        width: 400,
        margin: 3,
        color: {
          dark: '#1f2937',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' as const
      };

      return await QRCode.toDataURL(dataString, qrOptions);
    } catch (error) {
      console.error('Error generando QR de tarjeta digital:', error);
      throw new Error('No se pudo generar el QR de tarjeta digital');
    }
  }
}