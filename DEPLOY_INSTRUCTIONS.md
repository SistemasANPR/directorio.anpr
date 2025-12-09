# Instrucciones de Despliegue - ANPR Directorio

## Paso 1: Descargar el código de Replit

1. En Replit, haz clic en los tres puntos (⋮) en la parte superior izquierda
2. Selecciona **"Download as zip"**
3. Guarda el archivo en tu computadora y descomprímelo

## Paso 2: Subir a GitHub

1. Abre la carpeta descomprimida en tu computadora
2. Abre una terminal/command prompt en esa carpeta
3. Ejecuta estos comandos:

```bash
git init
git add .
git commit -m "Initial commit - ANPR Directorio"
git branch -M main
git remote add origin https://github.com/SistemasANPR/directorio.anpr.git
git push -u origin main --force
```

Si te pide credenciales, usa tu usuario y token de GitHub.

## Paso 3: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub
2. Haz clic en **"Add New Project"**
3. Busca y selecciona el repositorio **directorio.anpr**
4. En la configuración del proyecto:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

## Paso 4: Configurar Variables de Entorno en Vercel

En la sección **"Environment Variables"** agrega las siguientes:

### Base de datos MySQL (Hostinger)
```
DATABASE_URL = mysql://u582611776_direct:Directorio123*@srv453.hstgr.io:3306/u582611776_anprdirect
```

### Cloudinary (para subir imágenes)
```
CLOUDINARY_CLOUD_NAME = Directorio
CLOUDINARY_API_KEY = 199867166746748
CLOUDINARY_API_SECRET = coLnjIuf8eoYDdM_luaMrR6eBL8
```

### Stripe (pagos)
```
STRIPE_SECRET_KEY = (tu clave secreta de Stripe)
VITE_STRIPE_PUBLIC_KEY = (tu clave pública de Stripe)
```

### Firebase (autenticación)
```
VITE_FIREBASE_API_KEY = (tu API key de Firebase)
VITE_FIREBASE_PROJECT_ID = (tu project ID de Firebase)
VITE_FIREBASE_APP_ID = (tu app ID de Firebase)
```

### Google Maps
```
VITE_GOOGLE_MAPS_API_KEY = (tu API key de Google Maps)
```

### TinyMCE (editor de texto)
```
VITE_TINYMCE_API_KEY = (tu API key de TinyMCE)
```

## Paso 5: Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que termine el proceso (puede tomar 2-5 minutos)
3. Una vez completado, recibirás una URL como: `https://directorio-anpr.vercel.app`

## Solución de problemas

### Si hay errores de build:
- Revisa que todas las variables de entorno estén configuradas
- Verifica los logs de construcción en Vercel

### Si las imágenes no suben:
- Verifica que las credenciales de Cloudinary sean correctas
- Asegúrate de que Cloudinary esté activo

### Si hay errores de base de datos:
- Verifica que "Remote MySQL" esté habilitado en Hostinger
- Confirma que la IP de Vercel tenga acceso (usando "Cualquier host" o %)

## Notas importantes

- Las imágenes se almacenan en Cloudinary, no en el servidor
- La base de datos está en Hostinger (MySQL)
- Firebase maneja la autenticación
- Stripe procesa los pagos en USD
