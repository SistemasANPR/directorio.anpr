# 📊 EXPORTACIÓN COMPLETA - BASE DE DATOS ANPR MÉXICO

**Fecha de exportación:** 23 de Septiembre 2025  
**Estado:** Datos reales y activos  

---

## 📋 RESUMEN DE DATOS EXPORTADOS

✅ **20 empresas** reales registradas  
✅ **18 usuarios** activos  
✅ **25 categorías** configuradas  
✅ **3 planes de membresía** con precios de Stripe  
✅ **7 etiquetas** activas  
✅ **1 certificado** oficial de ANPR México  
✅ **Geolocalización** real de empresas  
✅ **Datos de contacto** verificados  

---

## 📁 ARCHIVOS EXPORTADOS

### 1. `database_backup_real.sql`
- **Propósito:** Backup SQL con datos principales
- **Contiene:** Planes, etiquetas, certificados, usuario admin
- **Uso:** Para restaurar datos básicos en nueva instalación

### 2. `real_data_export.json`
- **Propósito:** Datos estructurados en formato JSON
- **Contiene:** Toda la información organizada y legible
- **Uso:** Para análisis y verificación de datos

### 3. `seed_data_real.ts`
- **Propósito:** Script de seeding con datos reales
- **Contiene:** Datos listos para insertar en código
- **Uso:** Para poblar nueva aplicación automáticamente

---

## 🚀 CÓMO USAR ESTOS DATOS

### Opción 1: Para Nueva Publicación
1. **Publicar la aplicación actual** con el fix del puerto que ya aplicamos
2. El sistema de auto-seeding poblará automáticamente los datos
3. ✅ **RECOMENDADO** - Más simple y seguro

### Opción 2: Para Nueva Instalación
1. Crear nueva aplicación Replit
2. Configurar variables de entorno (DATABASE_URL, STRIPE_SECRET_KEY, etc.)
3. Ejecutar `npm run db:push` para crear esquema
4. Importar datos del archivo `database_backup_real.sql`
5. Verificar que todo funcione correctamente

### Opción 3: Migración Manual
1. Usar `seed_data_real.ts` como referencia
2. Actualizar archivo `server/seed-data.ts` con datos reales
3. Ejecutar endpoint `/api/seed` para poblar

---

## ⚠️ NOTAS IMPORTANTES

### Datos Sensibles
- **Imágenes:** Rutas apuntan a `/uploads/images/` - verificar que existan
- **Stripe IDs:** Mantener productos configurados en Stripe
- **Firebase UIDs:** Verificar configuración de autenticación

### Configuración Requerida
```env
DATABASE_URL=postgresql://...
TESTING_STRIPE_SECRET_KEY=sk_test_...
TESTING_VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_FIREBASE_API_KEY=...
```

### Archivos de Usuario
- Las empresas tienen imágenes en `/uploads/`
- Certificados tienen documentos adjuntos
- Verificar que el almacenamiento esté configurado

---

## 🎯 RECOMENDACIÓN FINAL

**MEJOR OPCIÓN:** Publicar tu aplicación actual ya que:

1. ✅ **Puerto corregido** - El servidor ahora usa `process.env.PORT`
2. ✅ **Datos intactos** - Todas las 20 empresas están ahí
3. ✅ **Auto-seeding** - Sistema automático funcionando
4. ✅ **Sin riesgo** - No perdemos datos existentes
5. ✅ **Más rápido** - Lista para publicar inmediatamente

---

## 📞 DATOS DE CONTACTO DE EMPRESAS

Tu base de datos incluye empresas reales como:
- **Productos Jumbo** (Puebla)
- **ANPR** (Mérida, Yucatán)
- **Grupo Bugy** (Monterrey)
- **Dihla** (México)
- Y **16 empresas más** con datos completos

---

**¡Tu aplicación está lista para publicarse con todos estos datos reales!** 🎉