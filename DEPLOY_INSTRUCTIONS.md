# IMPORTANTE: Pasos para Desplegar

## 1. Hacer Commit y Push

```bash
git add .
git commit -m "Fix: Reorganizar middleware para servir archivos estáticos correctamente"
git push origin main
```

## 2. Verificar en Coolify

Después de hacer push:
1. Ve a Coolify
2. Haz click en "Redeploy"
3. Espera que termine el build
4. Verifica los logs

## 3. Limpiar Caché del Navegador

**En Chrome/Edge**:
- Presiona `Ctrl + Shift + Delete`
- Selecciona "Imágenes y archivos en caché"
- Click en "Borrar datos"

**O modo incógnito**:
- `Ctrl + Shift + N`
- Abre la URL

## 4. Verificar que Funciona

Abre la consola del navegador (F12) y verifica:
- No debe haber errores 404
- Los archivos JS deben cargar desde `/js/`
- El menú hamburguesa debe funcionar

---

## Si Sigue Sin Funcionar

Comparte los logs de Coolify para ver qué está pasando en el servidor.
