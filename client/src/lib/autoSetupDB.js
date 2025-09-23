// 🚀 ANPR México - Auto-configuración de Base de Datos de Producción
// Este archivo se ejecuta automáticamente cuando la aplicación se despliega

const SEED_TOKEN = 'anpr_seed_2025'; // Token de seguridad para seeding

const setupProductionDatabase = async () => {
    try {
        // Solo ejecutar en aplicaciones publicadas (dominios .replit.app)
        const isProduction = window.location.hostname.includes('.replit.app') || 
                            window.location.hostname.includes('replit.dev');
        
        if (!isProduction) {
            console.log('🔧 Modo desarrollo detectado - omitiendo auto-setup');
            return true;
        }

        console.log('🚀 Verificando configuración de base de datos en producción...');
        
        // 1. Verificar el estado actual de la base de datos
        const statusResponse = await fetch('/api/seed/status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!statusResponse.ok) {
            throw new Error(`Error verificando estado: ${statusResponse.status}`);
        }
        
        const status = await statusResponse.json();
        console.log('📊 Estado de la base de datos:', status);
        
        // 2. Si la base de datos está vacía, iniciar seeding automático
        if (status.isEmpty || status.membershipTypes === 0) {
            console.log('⚠️ Base de datos vacía detectada - iniciando poblado automático...');
            
            // Mostrar indicador de carga
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'auto-setup-loading';
            loadingDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            loadingDiv.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🌱</div>
                    <h2 style="margin-bottom: 10px;">Configurando ANPR México</h2>
                    <p style="opacity: 0.8; margin-bottom: 20px;">Poblando base de datos automáticamente...</p>
                    <div style="width: 50px; height: 50px; border: 3px solid #333; border-top: 3px solid #fff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loadingDiv);
            
            // 3. Ejecutar seeding
            const seedResponse = await fetch('/api/seed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Seed-Token': SEED_TOKEN
                }
            });
            
            if (!seedResponse.ok) {
                throw new Error(`Error en seeding: ${seedResponse.status}`);
            }
            
            const seedResult = await seedResponse.json();
            console.log('🎉 Seeding completado:', seedResult);
            
            // Mostrar mensaje de éxito
            loadingDiv.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                    <h2 style="color: #4ade80; margin-bottom: 10px;">¡Configuración Completada!</h2>
                    <p style="opacity: 0.8; margin-bottom: 10px;">Base de datos poblada exitosamente</p>
                    <p style="font-size: 14px; opacity: 0.6;">
                        • ${seedResult.results.membershipTypes} planes de membresía<br>
                        • ${seedResult.results.companies} empresas<br>
                        • ${seedResult.results.categories} categorías<br>
                        • ${seedResult.results.users} usuarios
                    </p>
                    <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">Recargando página...</p>
                </div>
            `;
            
            // Recargar la página después de 3 segundos
            setTimeout(() => {
                window.location.reload();
            }, 3000);
            
            return true;
        } else {
            console.log('✅ Base de datos ya configurada correctamente');
            console.log(`📊 Datos encontrados: ${status.membershipTypes} planes, ${status.companies} empresas, ${status.categories} categorías`);
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error en auto-setup de base de datos:', error);
        
        // Mostrar error al usuario solo en producción
        const isProduction = window.location.hostname.includes('.replit.app') || 
                            window.location.hostname.includes('replit.dev');
        
        if (isProduction) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 300px;
            `;
            errorDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">⚠️ Error de Configuración</div>
                <div style="font-size: 14px; opacity: 0.9;">
                    No se pudo configurar automáticamente la base de datos. 
                    Contacta al administrador.
                </div>
            `;
            document.body.appendChild(errorDiv);
            
            // Remover error después de 10 segundos
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 10000);
        }
        
        return false;
    }
};

// Ejecutar automáticamente al cargar la aplicación
if (typeof window !== 'undefined') {
    // Ejecutar después de que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(setupProductionDatabase, 1000);
        });
    } else {
        setTimeout(setupProductionDatabase, 1000);
    }
    
    // También exponer la función globalmente para debug
    window.setupProductionDatabase = setupProductionDatabase;
}

export default setupProductionDatabase;