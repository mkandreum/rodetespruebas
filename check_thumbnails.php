#!/usr/bin/env php
<?php
/**
 * Script de diagnóstico para verificar el estado de miniaturas
 */

echo "🔍 Diagnóstico de Miniaturas\n";
echo "============================\n\n";

require_once __DIR__ . '/security_config.php';

// 1. Verificar datos_app.json
$dataFile = getDataFile('datos_app.json');
if (!file_exists($dataFile)) {
    die("❌ datos_app.json no encontrado\n");
}

$appState = json_decode(file_get_contents($dataFile), true);
if (!$appState || !isset($appState['events'])) {
    die("❌ datos_app.json inválido\n");
}

echo "📄 Eventos en JSON: " . count($appState['events']) . "\n\n";

// 2. Verificar primer evento con galería
$eventWithGallery = null;
foreach ($appState['events'] as $event) {
    if (isset($event['galleryImages']) && count($event['galleryImages']) > 0) {
        $eventWithGallery = $event;
        break;
    }
}

if (!$eventWithGallery) {
    die("⚠️  No hay eventos con galería\n");
}

echo "📸 Evento: " . $eventWithGallery['name'] . "\n";
echo "   Imágenes: " . count($eventWithGallery['galleryImages']) . "\n";

// 3. Verificar galleryThumbnails
if (!isset($eventWithGallery['galleryThumbnails'])) {
    echo "   ❌ NO TIENE galleryThumbnails\n\n";
    echo "🔧 Solución: Ejecuta update_json_thumbnails_to_webp.php\n";
    exit(1);
}

echo "   Miniaturas: " . count($eventWithGallery['galleryThumbnails']) . "\n\n";

// 4. Mostrar ejemplos
echo "📋 Primeras 3 imágenes:\n";
for ($i = 0; $i < min(3, count($eventWithGallery['galleryImages'])); $i++) {
    $img = $eventWithGallery['galleryImages'][$i];
    $thumb = $eventWithGallery['galleryThumbnails'][$i] ?? 'NO EXISTE';

    echo "\n  Imagen $i:\n";
    echo "    Original: $img\n";
    echo "    Miniatura: $thumb\n";

    // Verificar si es WebP
    if (strpos($thumb, '.webp') !== false) {
        echo "    ✅ Es WebP\n";
    } else if (strpos($thumb, '.jpg') !== false || strpos($thumb, '.jpeg') !== false) {
        echo "    ❌ Es JPG (debería ser WebP)\n";
    }
}

echo "\n============================\n";
echo "✅ Verificación completada\n";
?>