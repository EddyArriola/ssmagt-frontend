# 📱 Funcionalidades QR Móvil - Sistema de Tarjetas de Salud

## ✨ Nuevas Características

### 🔄 Vista Doble de QR
- **QR Estándar**: Tamaño optimizado para visualización en web
- **QR Móvil HD**: Alta resolución (512px) optimizada para dispositivos móviles

### 📥 Opciones de Descarga Avanzadas

#### 1. Descarga Estándar
- Código QR básico para uso general
- Tamaño: 200-300px según configuración
- Nombre del archivo: `tarjeta_{id}_qr.png`

#### 2. Descarga Móvil HD
- QR de alta resolución (512px) optimizado para móviles
- Incluye información adicional del ciudadano en el nombre del archivo
- Máxima corrección de errores (Nivel H) para mejor lectura
- Nombre del archivo: `{nombre}_{apellido}_tarjeta_{tipo}_{fecha}_QR_mobile.png`

### 📋 Copiar al Portapapeles
- Funcionalidad disponible solo en navegadores compatibles
- Permite copiar la imagen QR directamente al portapapeles
- Útil para pegar en otras aplicaciones

### 🔗 Compartir QR (Web Share API)
- Disponible en dispositivos móviles con soporte Web Share API
- Permite compartir el QR directamente a través de apps nativas
- Incluye título y texto descriptivo automático
- Fallback a copia al portapapeles si no está disponible

## 🎛️ Controles de Interface

### Toggle Estándar/Móvil
```html
<button class="toggle-btn active">
  📊 Estándar
</button>
<button class="toggle-btn">
  📱 Móvil HD
</button>
```

### Botones de Acción
- **Descargar** (Verde): Descarga QR estándar
- **Móvil HD** (Púrpura): Descarga QR optimizado para móvil
- **Copiar** (Gris): Copia al portapapeles
- **Compartir** (Gris): Comparte usando Web Share API

## 🔧 Configuración del Componente

```html
<app-tarjeta-qr 
  [tarjeta]="tarjeta"
  [cuiCiudadano]="cui"
  size="large"
  [showDownload]="true"
  [showDetails]="true"
  [showMobileOptions]="true">
</app-tarjeta-qr>
```

### Propiedades Disponibles
- `showMobileOptions`: Habilita las opciones móviles (default: true)
- `size`: 'small' | 'medium' | 'large'
- `showDownload`: Muestra botones de descarga
- `showDetails`: Muestra información de la tarjeta

## 📊 Datos del QR

### QR Estándar
```json
{
  "id_tarjeta": 123,
  "id_solicitud": 456,
  "cui_ciudadano": "1234567890101",
  "tipo_tarjeta": 1,
  "fecha_emision": "2024-01-15",
  "fecha_vencimiento": "2025-01-15",
  "centro_salud": "Centro de Salud ABC",
  "estado": 2,
  "timestamp": "2024-10-26T..."
}
```

### QR Móvil
```json
{
  "version": "1.0",
  "mobile": true,
  // ... datos estándar ...
}
```

## 🌐 Compatibilidad de Navegadores

### Web Share API
- ✅ Chrome/Edge (Android/iOS)
- ✅ Safari (iOS)
- ❌ Desktop (fallback a copiar)

### Clipboard API
- ✅ Chrome/Edge/Firefox (HTTPS)
- ✅ Safari (con permisos)
- ❌ HTTP (por seguridad)

## 🎨 Personalización CSS

### Variables Principales
```css
--qr-primary-color: #7db4a6;
--qr-mobile-gradient: linear-gradient(135deg, #8b5cf6, #7c3aed);
--qr-border-radius: 8px;
```

### Clases Modificables
- `.action-button.primary`: Botón descargar estándar
- `.action-button.mobile`: Botón descargar móvil
- `.action-button.secondary`: Botones copiar/compartir
- `.toggle-btn`: Botones de alternancia
- `.hd-badge`: Indicador HD

## 🚀 Ejemplos de Uso

### Uso Básico
```typescript
// En el componente
async downloadMobileQR(): Promise<void> {
  await this.qrService.downloadMobileQRCode(qrData, nombreCiudadano);
}
```

### Configuración Avanzada
```typescript
// Generar QR con configuración personalizada
const mobileQR = await this.qrService.generateMobileQRCode(qrData);

// Compartir con información personalizada  
await this.qrService.shareQRCode(qrURL, {
  tipo: 'Tarjeta de Salud',
  id: 123
});
```

## 📝 Notas Técnicas

1. **Rendimiento**: Los QR móviles se generan bajo demanda para optimizar la carga inicial
2. **Seguridad**: Todas las operaciones de portapapeles requieren HTTPS
3. **Accesibilidad**: Todos los botones incluyen `title` y soporte para focus
4. **Responsividad**: Interface adaptativa para diferentes tamaños de pantalla

---

*Funcionalidades implementadas el 26 de octubre de 2024*