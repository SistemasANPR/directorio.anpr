import { useState } from "react";
import { Search, Bell, Settings, LogOut, User, ChevronDown, Building, Users, BarChart3, CreditCard, FileText, Shield, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface DashboardNavbarProps {
  userRole?: string;
  userName?: string;
  userAvatar?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

export default function DashboardNavbar({
  userRole = "admin",
  userName = "Administrador",
  userAvatar,
  onSearch,
  searchPlaceholder = "Buscar en el sistema...",
  className = "",
}: DashboardNavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navigationItems = [
    {
      title: "Panel Principal",
      href: "/dashboard",
      icon: BarChart3,
      description: "Resumen general del sistema"
    },
    {
      title: "Empresas",
      trigger: true,
      icon: Building,
      items: [
        {
          title: "Ver Empresas",
          href: "/dashboard/companies",
          description: "Gestionar directorio de empresas"
        },
        {
          title: "Categorías",
          href: "/dashboard/categories",
          description: "Administrar categorías"
        },
        {
          title: "Certificados",
          href: "/dashboard/certificates",
          description: "Gestionar certificaciones"
        },
        {
          title: "Etiquetas",
          href: "/dashboard/tags",
          description: "Administrar etiquetas"
        }
      ]
    },
    {
      title: "Usuarios",
      href: "/dashboard/users",
      icon: Users,
      description: "Administrar usuarios del sistema"
    },
    {
      title: "Membresias",
      trigger: true,
      icon: CreditCard,
      items: [
        {
          title: "Tipos de Membresía",
          href: "/dashboard/memberships",
          description: "Configurar planes y precios"
        },
        {
          title: "Pagos",
          href: "/dashboard/payments",
          description: "Gestionar transacciones"
        }
      ]
    },
    {
      title: "Contenido",
      trigger: true,
      icon: FileText,
      items: [
        {
          title: "Configuración Frontend",
          href: "/dashboard/frontend-config",
          description: "Personalizar apariencia"
        },
        {
          title: "Configuración Email",
          href: "/dashboard/email-config",
          description: "Ajustes de correo"
        }
      ]
    }
  ];

  // Filtrar navegación según el rol
  const filteredNavigation = userRole === "admin" 
    ? navigationItems 
    : navigationItems.filter(item => 
        item.title === "Panel Principal" || 
        item.title === "Empresas" || 
        item.title === "Contenido"
      );

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="container flex h-16 items-center">
        {/* Logo/Brand */}
        <div className="mr-6 flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden font-bold sm:inline-block text-lg">
            ANPR México
          </span>
        </div>

        {/* Navigation Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {filteredNavigation.map((item) => (
              <NavigationMenuItem key={item.title}>
                {item.trigger ? (
                  <>
                    <NavigationMenuTrigger className="flex items-center space-x-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {item.items?.map((subItem) => (
                          <li key={subItem.title}>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                href={subItem.href}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setLocation(subItem.href);
                                }}
                              >
                                <div className="text-sm font-medium leading-none">
                                  {subItem.title}
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {subItem.description}
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink asChild>
                    <a
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setLocation(item.href!);
                      }}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </a>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Search Bar */}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 w-full"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/dashboard/settings")}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-auto px-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback>
                      {userName.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex md:flex-col md:items-start">
                    <span className="text-sm font-medium">{userName}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {userRole}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/dashboard/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              {userRole === "admin" && (
                <DropdownMenuItem onClick={() => setLocation("/dashboard/admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Administración</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}