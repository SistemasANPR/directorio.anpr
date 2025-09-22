# 🚀 ANPR México - Migración a Producción

## ✅ APLICACIÓN PUBLICADA

Tu aplicación ya está funcionando en: **https://directorio-sistemas.replit.app**

## 🔥 MIGRACIÓN AUTOMÁTICA DE DATOS

### OPCIÓN 1: Script Automático (Recomendado)

1. **Ve a tu aplicación publicada** (el dominio .replit.app)
2. **Accede a la consola** de la aplicación publicada
3. **Ejecuta este comando:**
   ```bash
   ./setup_production_auto.sh
   ```

### OPCIÓN 2: Migración Manual

Si el script automático no funciona, sigue estos pasos:

1. **Crear base de datos PostgreSQL** en tu app publicada:
   - Panel lateral → Database → Add Database → PostgreSQL

2. **Subir archivos** a tu aplicación publicada:
   - `backup_completo_final.sql` (base de datos completa)
   - `setup_production_auto.sh` (script de migración)

3. **Ejecutar migración** en la consola:
   ```bash
   psql $DATABASE_URL < backup_completo_final.sql
   ```

## 🎯 RESULTADO ESPERADO

Después de la migración tendrás:

- ✅ **3 Planes de Membresía** disponibles en /planes
- ✅ **20 Empresas** registradas
- ✅ **89 Usuarios** en el sistema
- ✅ **27 Categorías** de productos
- ✅ **Sistema de pagos** funcionando
- ✅ **Certificados y proyectos** importados

## 🔍 VERIFICAR ÉXITO

1. Ve a: `https://tu-app.replit.app/planes`
2. Deberías ver:
   - Plan Básico: $35/mes - $385/año
   - Plan Premium: $65/mes - $715/año ⭐
   - Membresía Empresarial: Gratuita

## 📞 SOPORTE

Si tienes problemas con la migración:
1. Revisa que la base de datos PostgreSQL esté creada
2. Verifica que los archivos estén subidos correctamente  
3. Ejecuta el script paso a paso si es necesario

¡Tu aplicación ANPR México está lista para producción! 🎉