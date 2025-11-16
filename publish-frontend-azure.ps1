# Script para construir y publicar frontend a Docker Hub
# Autor: Sistema de automatización
# Fecha: $(Get-Date -Format "yyyy-MM-dd")

Write-Host "🚀 Iniciando construcción y publicación del frontend para Azure..." -ForegroundColor Green

# Variables de configuración
$DOCKER_USERNAME = "arriolaeddy023"
$FRONTEND_IMAGE = "ssmagt-frontend"
$FRONTEND_TAG = "azure"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Este script debe ejecutarse desde el directorio ssmagt-frontend" -ForegroundColor Red
    exit 1
}

# Construir la aplicación Angular para producción
Write-Host "📦 Construyendo aplicación Angular para producción..." -ForegroundColor Yellow
npm run build:azure

# Verificar que el build fue exitoso
if (-not (Test-Path "dist")) {
    Write-Host "❌ Error: La construcción de Angular falló" -ForegroundColor Red
    exit 1
}

# Construir imagen Docker
Write-Host "🐳 Construyendo imagen Docker para frontend..." -ForegroundColor Yellow
docker build -f Dockerfile.prod -t "${FRONTEND_IMAGE}:${FRONTEND_TAG}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Falló la construcción de la imagen Docker" -ForegroundColor Red
    exit 1
}

# Etiquetar la imagen para Docker Hub
Write-Host "🏷️ Etiquetando imagen para Docker Hub..." -ForegroundColor Yellow
docker tag "${FRONTEND_IMAGE}:${FRONTEND_TAG}" "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${FRONTEND_TAG}"
docker tag "${FRONTEND_IMAGE}:${FRONTEND_TAG}" "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest"

# Hacer push a Docker Hub
Write-Host "📤 Publicando imagen en Docker Hub..." -ForegroundColor Yellow
docker push "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${FRONTEND_TAG}"
docker push "${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Falló la publicación en Docker Hub" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend publicado exitosamente en Docker Hub!" -ForegroundColor Green
Write-Host "📍 Imagen disponible en: ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${FRONTEND_TAG}" -ForegroundColor Cyan
Write-Host "📍 Imagen disponible en: ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest" -ForegroundColor Cyan

Write-Host ""
Write-Host "🌐 Próximos pasos para Azure App Service:" -ForegroundColor Magenta
Write-Host "1. Crear un nuevo App Service en Azure Portal" -ForegroundColor White
Write-Host "2. Configurar Container Settings:" -ForegroundColor White
Write-Host "   - Registry: Docker Hub" -ForegroundColor Gray
Write-Host "   - Image: ${DOCKER_USERNAME}/${FRONTEND_IMAGE}" -ForegroundColor Gray
Write-Host "   - Tag: ${FRONTEND_TAG}" -ForegroundColor Gray
Write-Host "3. Configurar puerto 80 en App Settings" -ForegroundColor White
Write-Host "4. Habilitar CORS si es necesario" -ForegroundColor White