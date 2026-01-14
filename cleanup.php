<?php
/**
 * CLEANUP SCRIPT - Elimina carpetas antiguas de código
 * 
 * Este script borra las carpetas 'js/' y 'scripts/' antiguas
 * que están causando conflictos con la nueva estructura 'lib/'
 * 
 * INSTRUCCIONES:
 * 1. Sube este archivo a la raíz de tu servidor
 * 2. Accede a: https://tudominio.com/cleanup.php
 * 3. Verifica que las carpetas se hayan borrado
 * 4. BORRA ESTE ARCHIVO del servidor por seguridad
 */

header('Content-Type: text/plain; charset=utf-8');

function deleteDirectory($dir) {
    if (!file_exists($dir)) {
        return "❌ La carpeta '$dir' no existe.\n";
    }
    
    if (!is_dir($dir)) {
        return "❌ '$dir' no es una carpeta.\n";
    }
    
    $files = array_diff(scandir($dir), ['.', '..']);
    
    foreach ($files as $file) {
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        is_dir($path) ? deleteDirectory($path) : unlink($path);
    }
    
    rmdir($dir);
    return "✅ Carpeta '$dir' eliminada correctamente.\n";
}

echo "=== LIMPIEZA DE CARPETAS ANTIGUAS ===\n\n";

// Borrar carpeta 'js/' si existe
echo deleteDirectory(__DIR__ . '/js');

// Borrar carpeta 'scripts/' si existe  
echo deleteDirectory(__DIR__ . '/scripts');

echo "\n=== LIMPIEZA COMPLETADA ===\n";
echo "Por favor, BORRA este archivo (cleanup.php) del servidor por seguridad.\n";
