#!/bin/sh
set -e

# Función para reemplazar variables de entorno en archivos JavaScript
replace_env_vars() {
    echo "Reemplazando variables de entorno en archivos JavaScript..."
    
    # Buscar archivos main.*.js en el directorio
    for file in /usr/share/nginx/html/main*.js; do
        if [ -f "$file" ]; then
            echo "Procesando archivo: $file"
            
            # Reemplazar API_URL si está definida
            if [ -n "$API_URL" ]; then
                sed -i "s|PLACEHOLDER_API_URL|$API_URL|g" "$file"
                sed -i "s|http://localhost:3000|$API_URL|g" "$file"
                echo "API_URL reemplazada con: $API_URL"
            fi
            
            # Agregar más variables según necesidad
            if [ -n "$ENVIRONMENT" ]; then
                sed -i "s|PLACEHOLDER_ENVIRONMENT|$ENVIRONMENT|g" "$file"
                echo "ENVIRONMENT reemplazada con: $ENVIRONMENT"
            fi
        fi
    done
    
    # También buscar en archivos chunk*.js
    for file in /usr/share/nginx/html/chunk*.js; do
        if [ -f "$file" ]; then
            echo "Procesando chunk: $file"
            if [ -n "$API_URL" ]; then
                sed -i "s|http://localhost:3000|$API_URL|g" "$file"
            fi
        fi
    done
}

# Ejecutar reemplazo de variables
replace_env_vars

# Ejecutar el comando pasado como argumentos
exec "$@"