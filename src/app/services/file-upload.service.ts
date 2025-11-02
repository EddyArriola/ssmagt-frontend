import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export interface FileUploadResult {
  downloadURL: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  constructor(private storage: Storage) {}

  /**
   * Sube un archivo a Firebase Storage
   * @param file - Archivo a subir
   * @param folderPath - Carpeta donde guardar el archivo (ej: 'solicitudes-tarjetas/salud')
   * @param userId - ID del usuario (opcional, para organizar por usuario)
   * @returns Observable con la información del archivo subido
   */
  uploadFile(file: File, folderPath: string, userId?: string): Observable<FileUploadResult> {
    // Validar archivo
    if (!file) {
      return throwError(() => new Error('No se proporcionó ningún archivo'));
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return throwError(() => new Error('El archivo es demasiado grande. Tamaño máximo: 10MB'));
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return throwError(() => new Error('Tipo de archivo no permitido. Solo se permiten: PDF, DOC, DOCX, JPG, PNG'));
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const fileExtension = this.getFileExtension(file.name);
    const uniqueFileName = `${timestamp}_${randomString}${fileExtension}`;

    // Construir ruta completa
    const fullPath = userId 
      ? `${folderPath}/${userId}/${uniqueFileName}`
      : `${folderPath}/${uniqueFileName}`;

    // Crear referencia del archivo
    const fileRef = ref(this.storage, fullPath);

    // Subir archivo
    return from(uploadBytes(fileRef, file)).pipe(
      switchMap(() => from(getDownloadURL(fileRef))),
      switchMap(downloadURL => {
        const result: FileUploadResult = {
          downloadURL,
          fileName: file.name,
          filePath: fullPath,
          fileSize: file.size,
          uploadedAt: new Date()
        };
        return from(Promise.resolve(result));
      }),
      catchError(error => {
        console.error('Error al subir archivo:', error);
        return throwError(() => new Error('Error al subir el archivo. Inténtalo de nuevo.'));
      })
    );
  }

  /**
   * Elimina un archivo de Firebase Storage
   * @param filePath - Ruta del archivo en Firebase Storage
   * @returns Observable de la operación de eliminación
   */
  deleteFile(filePath: string): Observable<void> {
    const fileRef = ref(this.storage, filePath);
    return from(deleteObject(fileRef)).pipe(
      catchError(error => {
        console.error('Error al eliminar archivo:', error);
        return throwError(() => new Error('Error al eliminar el archivo'));
      })
    );
  }

  /**
   * Obtiene la extensión del archivo
   * @param fileName - Nombre del archivo
   * @returns Extensión del archivo con punto (ej: '.pdf')
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot) : '';
  }

  /**
   * Formatea el tamaño del archivo en formato legible
   * @param bytes - Tamaño en bytes
   * @returns Tamaño formateado (ej: '1.5 MB')
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Valida si el tipo de archivo es permitido
   * @param file - Archivo a validar
   * @returns true si es válido, false si no
   */
  validateFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    return allowedTypes.includes(file.type);
  }
}