import { Facebook, Twitter, Instagram, Youtube, Music, MessageCircle } from "lucide-react";
import anprLogo from "@assets/anpr_logo.png";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white">
      {/* Separador superior */}
      <div className="w-full h-1 bg-gradient-to-r from-green-400 to-green-500"></div>
      
      {/* Contenido principal del footer */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Logo y marca */}
          <div className="flex items-center justify-center md:justify-start">
            <img 
              src={anprLogo}
              alt="ANPR México - Asociación Nacional de Parques y Recreación de México"
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Información de contacto */}
          <div className="text-center">
            <div className="text-sm mb-2">Todos los derechos reservados • ANPR 2016 - 2022</div>
            <div className="text-sm mb-1">Tel. +52 9999 44 4060</div>
            <div className="text-sm">
              <a href="mailto:info@anpr.org.mx" className="hover:text-green-400 transition-colors">
                info@anpr.org.mx
              </a>
            </div>
          </div>

          {/* Redes sociales */}
          <div className="text-center md:text-right">
            <div className="text-sm font-medium mb-4">Síguenos:</div>
            <div className="flex justify-center md:justify-end space-x-3">
              <a 
                href="https://facebook.com/anprmexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com/anprmexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com/anprmexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://youtube.com/anprmexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a 
                href="https://open.spotify.com/user/anprmexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
              >
                <Music className="w-5 h-5" />
              </a>
              <a 
                href="https://wa.me/5299994440600" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Línea inferior con aviso de privacidad */}
      <div className="border-t border-blue-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-center text-sm text-blue-300">
            <a href="/privacy" className="hover:text-white transition-colors mr-4">
              Aviso de Privacidad
            </a>
            <span className="mr-4">•</span>
            <span>© 2025 Asociación Nacional de Parques y Recreación</span>
          </div>
        </div>
      </div>
    </footer>
  );
}