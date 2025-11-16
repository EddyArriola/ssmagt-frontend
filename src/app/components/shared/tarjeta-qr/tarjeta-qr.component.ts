import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QrCodeService, QRCodeData } from '../../../services/qr-code.service';
import { Tarjeta } from '../../../interfaces/tarjeta';

@Component({
  selector: 'app-tarjeta-qr',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tarjeta-qr.component.html',
  styleUrl: './tarjeta-qr.component.css'
})
export class TarjetaQrComponent implements OnInit, OnChanges {
  @Input() tarjeta!: Tarjeta;
  @Input() cuiCiudadano?: string;
  @Input() nombreCiudadano?: string; // Información adicional del ciudadano
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showDownload: boolean = true;
  @Input() showDetails: boolean = true;
  @Input() showMobileOptions: boolean = true;

  qrCodeUrl: string = '';
  mobileQrCodeUrl: string = '';
  isLoading: boolean = false;
  error: string = '';
  showMobileView: boolean = false;
  supportsShare: boolean = false;
  supportsClipboard: boolean = false;

  constructor(private qrCodeService: QrCodeService) {}

  ngOnInit(): void {
    this.checkBrowserSupport();
    if (this.tarjeta) {
      this.generateQRCode();
    }
  }

  private checkBrowserSupport(): void {
    // Verificar soporte para Web Share API
    this.supportsShare = 'share' in navigator && 'canShare' in navigator;
    
    // Verificar soporte para Clipboard API
    this.supportsClipboard = 'clipboard' in navigator && 'write' in navigator.clipboard;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tarjeta'] && this.tarjeta) {
      this.generateQRCode();
    }
  }

  async generateQRCode(): Promise<void> {
    if (!this.tarjeta) {
      this.error = 'No se proporcionaron datos de la tarjeta';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      const qrData: QRCodeData = {
        id_tarjeta: this.tarjeta.id_tarjeta,
        id_solicitud: this.tarjeta.id_solicitud || 0,
        cui_ciudadano: this.cuiCiudadano,
        tipo_tarjeta: this.tarjeta.solicitud_tarjeta?.tipo_tarjeta || 1,
        fecha_emision: this.tarjeta.fecha_emision,
        fecha_vencimiento: this.tarjeta.fecha_vencimiento,
        centro_salud: this.tarjeta.solicitud_tarjeta?.id_centro_de_salud || 0,
        estado: this.tarjeta.estado
      };

      const sizeConfig = this.getSizeConfig();
      
      // Generar QR normal
      this.qrCodeUrl = await this.qrCodeService.generateQRCode(qrData, {
        width: sizeConfig.width,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#FFFFFF'
        }
      });

      // Generar QR móvil si está habilitado
      if (this.showMobileOptions) {
        this.mobileQrCodeUrl = await this.qrCodeService.generateMobileQRCode(qrData);
      }

    } catch (error) {
      console.error('Error generando código QR:', error);
      this.error = 'No se pudo generar el código QR';
    } finally {
      this.isLoading = false;
    }
  }

  private getSizeConfig(): { width: number } {
    switch (this.size) {
      case 'small': return { width: 120 };
      case 'medium': return { width: 200 };
      case 'large': return { width: 300 };
      default: return { width: 200 };
    }
  }

  downloadQR(): void {
    if (this.qrCodeUrl) {
      const filename = `tarjeta_${this.tarjeta.id_tarjeta}_qr.png`;
      this.qrCodeService.downloadQRCode(this.qrCodeUrl, filename);
    }
  }

  async downloadMobileQR(): Promise<void> {
    try {
      this.isLoading = true;
      const qrData: QRCodeData = {
        id_tarjeta: this.tarjeta.id_tarjeta,
        id_solicitud: this.tarjeta.id_solicitud || 0,
        cui_ciudadano: this.cuiCiudadano,
        tipo_tarjeta: this.tarjeta.solicitud_tarjeta?.tipo_tarjeta || 1,
        fecha_emision: this.tarjeta.fecha_emision,
        fecha_vencimiento: this.tarjeta.fecha_vencimiento,
        centro_salud: this.tarjeta.solicitud_tarjeta?.id_centro_de_salud || 0,
        estado: this.tarjeta.estado
      };

      // Generar nombre del archivo usando información disponible
      const nombreCiudadano = this.nombreCiudadano || 
        (this.tarjeta.solicitud_tarjeta?.nombres && this.tarjeta.solicitud_tarjeta?.apellidos
          ? `${this.tarjeta.solicitud_tarjeta.nombres}_${this.tarjeta.solicitud_tarjeta.apellidos}`
          : (this.cuiCiudadano ? `ciudadano_${this.cuiCiudadano}` : undefined));

      await this.qrCodeService.downloadMobileQRCode(qrData, nombreCiudadano);
    } catch (error) {
      this.error = 'Error al descargar QR móvil';
      console.error('Error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async copyToClipboard(): Promise<void> {
    try {
      const qrUrl = this.getCurrentQRUrl();
      await this.qrCodeService.copyQRToClipboard(qrUrl);
      // Mostrar mensaje de éxito
      this.showSuccessMessage('QR copiado al portapapeles exitosamente');
    } catch (error) {
      this.error = 'Error al copiar QR al portapapeles';
      console.error('Error:', error);
    }
  }

  async shareQR(): Promise<void> {
    try {
      const qrUrl = this.getCurrentQRUrl();
      const tipoTarjeta = this.tarjeta.solicitud_tarjeta?.tipo_tarjeta === 1 
        ? 'Tarjeta de Salud' 
        : 'Tarjeta de Manipulación de Alimentos';
      
      await this.qrCodeService.shareQRCode(qrUrl, {
        tipo: tipoTarjeta,
        id: this.tarjeta.id_tarjeta
      });
    } catch (error) {
      // Fallback: copiar al portapapeles si Web Share API no está disponible
      if (this.supportsClipboard) {
        await this.copyToClipboard();
      } else {
        this.error = 'No se pudo compartir el QR';
      }
      console.error('Error compartiendo:', error);
    }
  }

  getCurrentQRUrl(): string {
    return this.showMobileView ? this.mobileQrCodeUrl : this.qrCodeUrl;
  }

  toggleMobileView(): void {
    this.showMobileView = !this.showMobileView;
  }

  private showSuccessMessage(message: string): void {
    // Implementación temporal con alert, se puede mejorar con un toast system
    alert(message);
  }

  getTipoTarjetaLabel(): string {
    const tipo = this.tarjeta.solicitud_tarjeta?.tipo_tarjeta;
    switch (tipo) {
      case 1: return 'Tarjeta de Salud';
      case 2: return 'Manipulación de Alimentos';
      default: return 'Tarjeta de Salud';
    }
  }

  getFechaEmisionFormatted(): string {
    if (this.tarjeta.fecha_emision) {
      const fecha = new Date(this.tarjeta.fecha_emision);
      return fecha.toLocaleDateString('es-ES');
    }
    return 'No disponible';
  }

  getFechaVencimientoFormatted(): string {
    if (this.tarjeta.fecha_vencimiento) {
      const fecha = new Date(this.tarjeta.fecha_vencimiento);
      return fecha.toLocaleDateString('es-ES');
    }
    return 'No disponible';
  }

  isVigente(): boolean {
    if (this.tarjeta.fecha_vencimiento) {
      const fechaVencimiento = new Date(this.tarjeta.fecha_vencimiento);
      const fechaActual = new Date();
      return fechaVencimiento > fechaActual;
    }
    return true;
  }

  getEstadoLabel(): string {
    switch (this.tarjeta.estado) {
      case 1: return 'Pendiente';
      case 2: return 'Aprobada';
      case 3: return 'Vencida';
      case 4: return 'Cancelada';
      default: return 'Desconocido';
    }
  }

  getEstadoClass(): string {
    switch (this.tarjeta.estado) {
      case 2: return 'estado-aprobada';
      case 3: return 'estado-vencida';
      case 4: return 'estado-cancelada';
      default: return 'estado-pendiente';
    }
  }
}
