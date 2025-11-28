# Guía de Despliegue en Vercel con Cloudinary y PostgreSQL

## Prerequisitos
- Cuenta en Vercel (vercel.com)
- Base de datos PostgreSQL en Hostinger (u otro proveedor)
- Cuenta de Stripe con API keys
- Cuenta de Cloudinary (cloudinary.com) - plan gratuito disponible

---

## Paso 1: Crear Cuenta en Cloudinary

1. Ve a [cloudinary.com](https://cloudinary.com) y crea una cuenta gratuita
2. Una vez registrado, ve al **Dashboard**
3. Anota los siguientes datos (están en la sección "Product Environment Credentials"):
   - **Cloud Name**: tu nombre de cloud (ej: `dxxx1234`)
   - **API Key**: tu clave API (ej: `123456789012345`)
   - **API Secret**: tu secreto API (ej: `AbCdEfGhIjKlMnOpQrStUvWxYz12`)

---

## Paso 2: Configurar Base de Datos en Hostinger

1. Accede a tu panel de Hostinger
2. Ve a **Bases de datos** → **PostgreSQL** (o MySQL dependiendo de tu plan)
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

**IMPORTANTE**: Asegúrate de que el servidor de Hostinger permita conexiones externas a la base de datos.

---

## Paso 3: Subir el Proyecto a GitHub

1. Crea un repositorio en GitHub
2. En tu proyecto, inicializa git si no lo has hecho:
```bash
git init
git add .
git commit -m "Initial commit"
```
3. Conecta con tu repositorio:
```bash
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

---

## Paso 4: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New..."** → **"Project"**
3. Selecciona tu repositorio de GitHub
4. Configura el proyecto:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`

---

## Paso 5: Configurar Variables de Entorno en Vercel

En la sección **Environment Variables**, agrega TODAS estas variables:

### Base de Datos
| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu URL de PostgreSQL de Hostinger |

### Cloudinary (OBLIGATORIO para uploads)
| Variable | Valor |
|----------|-------|
| `CLOUDINARY_CLOUD_NAME` | Tu Cloud Name de Cloudinary |
| `CLOUDINARY_API_KEY` | Tu API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | Tu API Secret de Cloudinary |

### Stripe
| Variable | Valor |
|----------|-------|
| `STRIPE_SECRET_KEY` | Tu clave secreta de Stripe (sk_live_...) |
| `STRIPE_PUBLISHABLE_KEY` | Tu clave pública de Stripe (pk_live_...) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Tu clave pública de Stripe (misma que arriba) |

### Firebase
| Variable | Valor |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | Tu API key de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Tu dominio de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Tu project ID de Firebase |

### Google Maps
| Variable | Valor |
|----------|-------|
| `VITE_GOOGLE_MAPS_API_KEY` | Tu API key de Google Maps |

### General
| Variable | Valor |
|----------|-------|
| `NODE_ENV` | production |

---

## Paso 6: Desplegar

1. Click en **"Deploy"**
2. Espera a que termine el despliegue (puede tomar 2-5 minutos)
3. Tu aplicación estará disponible en `tu-proyecto.vercel.app`

---

## Paso 7: Migrar la Base de Datos

Después del primer despliegue, necesitas crear las tablas en tu base de datos de Hostinger.

### Opción A: Desde tu computadora local
1. Configura la variable de entorno:
```bash
# En Windows (PowerShell)
$env:DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD?sslmode=require"

# En Mac/Linux
export DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD?sslmode=require"
```

2. Ejecuta la migración:
```bash
npm run db:push
```

### Opción B: Usando un cliente SQL
Puedes ejecutar el SQL de creación de tablas directamente usando un cliente como DBeaver, TablePlus, o phpMyAdmin.

---

## Verificación

Una vez desplegado, verifica que todo funcione:

1. ✅ La página principal carga correctamente
2. ✅ El login/registro funciona
3. ✅ Las empresas se muestran desde la base de datos
4. ✅ Puedes subir imágenes (se guardan en Cloudinary)
5. ✅ El mapa de Google Maps funciona

---

## Solución de Problemas

### Error "Dynamic require not supported"
- Verifica que el archivo `vercel.json` esté en la raíz del proyecto
- Asegúrate de que no haya errores de sintaxis en el código

### Error de Base de Datos
- Verifica que `DATABASE_URL` tenga el formato correcto
- Asegúrate de que la base de datos de Hostinger permita conexiones externas
- Agrega `?sslmode=require` al final de tu URL

### La página muestra código fuente
- Este error ocurre cuando Vercel no reconoce el proyecto como una API
- Verifica que los archivos `api/index.ts` y `vercel.json` existan

### Las imágenes no se suben
- Verifica que las 3 variables de Cloudinary estén configuradas
- Revisa los logs en Vercel para ver el error específico

### Error 500 en las APIs
- Revisa los logs en **Vercel Dashboard** → Tu proyecto → **Functions** → **Logs**

---

## Soporte

Si tienes problemas, revisa los logs en:
- **Vercel Dashboard** → Tu proyecto → **Deployments** → Click en el deployment → **Functions**
