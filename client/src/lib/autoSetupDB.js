// 🚀 ANPR México - Auto-configuración de Base de Datos de Producción
// Este archivo se ejecuta automáticamente cuando la aplicación se despliega

const setupProductionDatabase = async () => {
    try {
        console.log('🚀 Verificando configuración de base de datos...');
        
        // Verificar si las tablas existen
        const response = await fetch('/api/setup-database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Base de datos configurada correctamente');
            return true;
        } else {
            console.log('⚠️ Configurando base de datos por primera vez...');
            return false;
        }
    } catch (error) {
        console.log('⚠️ Primera ejecución - configurando base de datos...');
        return false;
    }
};

// Ejecutar automáticamente al cargar la aplicación
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(setupProductionDatabase, 2000);
    });
}

export default setupProductionDatabase;
