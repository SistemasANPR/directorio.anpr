# Guía de Despliegue en Vercel

## Prerequisitos
- Cuenta en Vercel (vercel.com)
- Base de datos PostgreSQL en Hostinger (u otro proveedor)
- Cuenta de Stripe con API keys

## Paso 1: Configurar Base de Datos en Hostinger

1. Accede a tu panel de Hostinger
2. Ve a **Bases de datos** → **PostgreSQL**
3. Crea una nueva base de datos
4. Anota los siguientes datos:
   - Host (ej: `postgres.hostinger.com`)
   - Puerto (normalmente `5432`)
   - Nombre de la base de datos
   - Usuario
   - Contraseña

5. Construye tu DATABASE_URL:
```
postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD?sslmode=require
```

Ejemplo:
```
postgresql://u123456789_admin:MiPassword123@srv123.hostinger.com:5432/u123456789_anpr?sslmode=require
```

## Paso 2: Subir el Proyecto a GitHub

1. Crea un repositorio en GitHub
2. Sube todo el código del proyecto

## Paso 3: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New..."** → **"Project"**
3. Selecciona tu repositorio de GitHub
4. Configura el proyecto:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`

## Paso 4: Configurar Variables de Entorno en Vercel

En la sección **Environment Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu URL de PostgreSQL de Hostinger |
| `STRIPE_SECRET_KEY` | Tu clave secreta de Stripe (sk_live_...) |
| `STRIPE_PUBLISHABLE_KEY` | Tu clave pública de Stripe (pk_live_...) |
| `VITE_FIREBASE_API_KEY` | Tu API key de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Tu dominio de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Tu project ID de Firebase |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Tu clave pública de Stripe |
| `VITE_GOOGLE_MAPS_API_KEY` | Tu API key de Google Maps |
| `NODE_ENV` | production |

## Paso 5: Desplegar

1. Click en **"Deploy"**
2. Espera a que termine el despliegue
3. Tu aplicación estará disponible en `tu-proyecto.vercel.app`

## Paso 6: Migrar la Base de Datos

Después del primer despliegue, necesitas crear las tablas en tu base de datos de Hostinger:

1. Desde tu computadora local, configura la variable de entorno:
```bash
export DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD?sslmode=require"
```

2. Ejecuta la migración:
```bash
npm run db:push
```

## Limitaciones en Vercel

⚠️ **Importante**: Las siguientes funcionalidades NO funcionarán en Vercel:

1. **Uploads de archivos**: Los archivos subidos se perderán. Necesitarás integrar un servicio externo como:
   - Cloudinary
   - AWS S3
   - Firebase Storage

2. **WebSockets**: Las conexiones en tiempo real no funcionan en serverless

3. **Sesiones en memoria**: Cada request es independiente

## Solución de Problemas

### Error "Dynamic require not supported"
- Verifica que el archivo `vercel.json` esté correctamente configurado
- Asegúrate de que las dependencias sean compatibles con Node.js serverless

### Error de Base de Datos
- Verifica que `DATABASE_URL` tenga el formato correcto
- Asegúrate de que la base de datos de Hostinger permita conexiones externas
- Agrega `?sslmode=require` al final de tu URL

### La página muestra código fuente
- Verifica que los rewrites en `vercel.json` estén correctos
- Asegúrate de que el build se completó correctamente

## Soporte

Si tienes problemas, revisa los logs en:
- **Vercel Dashboard** → Tu proyecto → **Logs**
