#!/bin/sh
set -e

# Crear directorios de datos si no existen
mkdir -p /var/www/data_private
mkdir -p /var/www/html/uploads

# Corregir permisos en tiempo de ejecución
# Esto es necesario porque al montar volúmenes los permisos pueden cambiar
echo "Corrigiendo permisos de carpetas de datos..."
chown -R www-data:www-data /var/www/data_private
chown -R www-data:www-data /var/www/html/uploads

# Limpiar carpetas antiguas de código (js/ y scripts/)
echo "Limpiando carpetas antiguas de código..."
rm -rf /var/www/html/js
rm -rf /var/www/html/scripts
rm -f /var/www/html/app.js
echo "Limpieza completada."

# Continuar con el comando por defecto del contenedor
exec "$@"
