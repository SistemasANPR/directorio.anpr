import anprLogo from "@assets/anpr_logo.png";
import iconFacebook from "@assets/icon_facebook.webp";
import iconTwitter from "@assets/icon_twitter.webp";
import iconInstagram from "@assets/icon_instagram.webp";
import iconYoutube from "@assets/icon_youtube.webp";
import iconSpotify from "@assets/icon_spotify.webp";
import iconWhatsapp from "@assets/icon_whatsapp.webp";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white">
      {/* Separador superior */}
      <div className="w-full h-1 bg-gradient-to-r from-green-400 to-green-500"></div>
      
      {/* Contenido principal del footer */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start md:items-center">
          
          {/* Logo y marca */}
          <div className="flex items-center justify-center md:justify-start">
            <img 
              src={anprLogo}
              alt="ANPR México - Asociación Nacional de Parques y Recreación de México"
              className="h-12 sm:h-16 w-auto object-contain"
            />
          </div>

          {/* Información de contacto */}
          <div className="text-center">
            <div className="text-xs sm:text-sm mb-2">Todos los derechos reservados • ANPR 2016 - 2022</div>
            <div className="text-xs sm:text-sm mb-1">Tel. +52 9999 44 4060</div>
            <div className="text-xs sm:text-sm">
              <a href="mailto:info@anpr.org.mx" className="hover:text-green-400 transition-colors break-all">
                info@anpr.org.mx
              </a>
            </div>
          </div>

          {/* Redes sociales */}
          <div className="text-center md:text-right">
            <div className="text-xs sm:text-sm font-medium mb-4">Síguenos:</div>
            <div className="flex justify-center md:justify-end flex-wrap gap-2 sm:gap-3">
              <a 
                href="https://facebook.com/anprmexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src={iconFacebook} alt="Facebook" className="w-8 h-8 sm:w-10 sm:h-10" />
              </a>
              <a 
                href="https://twitter.com/anprmexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src={iconTwitter} alt="Twitter" className="w-8 h-8 sm:w-10 sm:h-10" />
              </a>
              <a 
                href="https://instagram.com/anprmexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src={iconInstagram} alt="Instagram" className="w-8 h-8 sm:w-10 sm:h-10" />
              </a>
              <a 
                href="https://youtube.com/anprmexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src={iconYoutube} alt="YouTube" className="w-8 h-8 sm:w-10 sm:h-10" />
              </a>
              <a 
                href="https://open.spotify.com/user/anprmexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src={iconSpotify} alt="Spotify" className="w-8 h-8 sm:w-10 sm:h-10" />
              </a>
              <a 
                href="https://wa.me/5299994440600" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src={iconWhatsapp} alt="WhatsApp" className="w-8 h-8 sm:w-10 sm:h-10" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Línea inferior con aviso de privacidad */}
      <div className="border-t border-blue-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-center text-xs sm:text-sm text-blue-300 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
            <a href="/privacy" className="hover:text-white transition-colors sm:mr-4">
              Aviso de Privacidad
            </a>
            <span className="hidden sm:inline mr-4">•</span>
            <span className="text-center">© 2025 Asociación Nacional de Parques y Recreación</span>
          </div>
        </div>
      </div>
    </footer>
  );
}