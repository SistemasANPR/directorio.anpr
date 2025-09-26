import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, MoreHorizontal, Edit, Trash2, Users as UsersIcon, User, Search, Filter, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { User as UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Swal from 'sweetalert2';

const userSchema = z.object({
  displayName: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "user", "representante"]),
  companyId: z.number().optional(),
}).refine((data) => {
  // Si el rol es representante, debe tener una empresa asignada
  if (data.role === "representante") {
    return data.companyId !== undefined && data.companyId > 0;
  }
  return true;
}, {
  message: "Los representantes deben tener una empresa asignada",
  path: ["companyId"],
});

type UserFormData = z.infer<typeof userSchema>;

export default function Users() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 50;
  const { toast } = useToast();

  const editForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      displayName: "",
      email: "",
      role: "user",
      companyId: undefined,
    },
  });

  // Fetch users with filters
  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users", { search: searchTerm, role: selectedRole }],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to fetch users");
      const allUsers = await response.json();
      
      // Apply client-side filtering since the API doesn't support it yet
      let filteredUsers = allUsers;
      
      if (searchTerm) {
        filteredUsers = filteredUsers.filter((user: UserType) =>
          user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (selectedRole && selectedRole !== "all") {
        filteredUsers = filteredUsers.filter((user: UserType) => user.role === selectedRole);
      }
      
      return filteredUsers;
    },
  });

  // Fetch WordPress users (without filtering in query)
  const { data: rawWordpressData, isLoading: isLoadingWordPress } = useQuery({
    queryKey: ["/api/wordpress-users"],
    queryFn: async () => {
      const response = await fetch("/api/wordpress-users", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch WordPress users");
      return response.json();
    },
  });

  // Apply filtering and pagination to WordPress users in memory
  const wordpressData = useMemo(() => {
    if (!rawWordpressData?.users) return { ...rawWordpressData, paginatedUsers: [], totalPages: 0, currentPage: 1 };
    
    let filteredUsers = rawWordpressData.users;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter((wpUser: any) =>
        wpUser.name?.toLowerCase().includes(searchLower) ||
        wpUser.email?.toLowerCase().includes(searchLower) ||
        wpUser.slug?.toLowerCase().includes(searchLower) ||
        wpUser.username?.toLowerCase().includes(searchLower) ||
        wpUser.first_name?.toLowerCase().includes(searchLower) ||
        wpUser.last_name?.toLowerCase().includes(searchLower) ||
        (wpUser.first_name && wpUser.last_name && 
         `${wpUser.first_name} ${wpUser.last_name}`.toLowerCase().includes(searchLower))
      );
    }
    
    if (selectedRole && selectedRole !== "all") {
      // For WordPress users, we can filter by their WordPress roles
      if (selectedRole === "admin") {
        filteredUsers = filteredUsers.filter((wpUser: any) => 
          wpUser.roles && wpUser.roles.includes("administrator")
        );
      } else if (selectedRole === "user") {
        filteredUsers = filteredUsers.filter((wpUser: any) => 
          wpUser.roles && (wpUser.roles.includes("subscriber") || wpUser.roles.includes("customer"))
        );
      } else if (selectedRole === "representante") {
        filteredUsers = filteredUsers.filter((wpUser: any) => 
          wpUser.roles && (wpUser.roles.includes("editor") || wpUser.roles.includes("author"))
        );
      }
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return { 
      ...rawWordpressData, 
      users: filteredUsers, // Keep all filtered users for count
      paginatedUsers, // Users for current page
      totalPages,
      currentPage,
      totalFiltered: filteredUsers.length
    };
  }, [rawWordpressData, searchTerm, selectedRole, currentPage, usersPerPage]);

  // Fetch companies for representative assignment
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies?limit=1000", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch companies");
      const data = await response.json();
      console.log("Debug - Companies loaded for dropdown:", data.companies?.length, "empresas");
      console.log("Debug - Companies names:", data.companies?.map((c: any) => c.nombreEmpresa));
      return data.companies || [];
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (!selectedUser) throw new Error("No user selected");
      const response = await apiRequest("PUT", `/api/users/${selectedUser.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      });
      editForm.reset();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    },
  });

  const onEditSubmit = (data: UserFormData) => {
    updateUserMutation.mutate(data);
  };

  const handleEdit = async (user: UserType) => {
    setSelectedUser(user);
    
    // Get user's assigned company if they are a representante
    let assignedCompanyId = undefined;
    if (user.role === "representante") {
      try {
        const response = await fetch(`/api/companies/by-user/${user.id}`, {
          credentials: "include",
        });
        if (response.ok) {
          const company = await response.json();
          assignedCompanyId = company.id;
        }
      } catch (error) {
        console.log("No company assigned to this user");
      }
    }
    
    editForm.reset({
      displayName: user.displayName || "",
      email: user.email,
      role: user.role as "admin" | "user" | "representante",
      companyId: assignedCompanyId,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (userId: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "user":
        return "bg-blue-100 text-blue-800";
      case "representante":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "user":
        return "Usuario";
      case "representante":
        return "Representante";
      default:
        return role;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setCurrentPage(1);
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra los usuarios del sistema y sus permisos</p>
        </div>
        <div className="text-sm text-gray-500">
          Los usuarios se crean automáticamente mediante Firebase Authentication
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros de búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar en ambas listas..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedRole} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="representante">Representante</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={clearFilters}
              className={searchTerm || selectedRole ? "border-orange-200 bg-orange-50" : ""}
            >
              Limpiar filtros
            </Button>
          </div>
          
          {(searchTerm || selectedRole) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Filtros activos:</strong>
                {searchTerm && <span className="ml-2">Búsqueda: "{searchTerm}"</span>}
                {selectedRole && selectedRole !== "all" && <span className="ml-2">Rol: {getRoleDisplayName(selectedRole)}</span>}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Los filtros se aplican tanto a usuarios del sistema como a usuarios de WordPress
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del sistema ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Cargando usuarios...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || selectedRole ? "No se encontraron usuarios" : "No hay usuarios registrados"}
              </p>
              <p className="text-gray-400 text-sm">
                {searchTerm || selectedRole 
                  ? "Intenta cambiar los filtros de búsqueda" 
                  : "Los usuarios aparecerán aquí cuando se registren"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.displayName || "Sin nombre"}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {user.firebaseUid.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                          {getRoleDisplayName(user.role)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WordPress Users Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Usuarios de WordPress ({wordpressData?.totalFiltered || wordpressData?.users?.length || 0})
              </CardTitle>
              <p className="text-sm text-gray-500">
                Usuarios sincronizados desde WordPress. Estos usuarios no pueden ser editados desde aquí.
                {wordpressData?.totalPages > 1 && (
                  <span className="ml-2 font-medium">
                    Página {currentPage} de {wordpressData.totalPages} 
                    (mostrando {usersPerPage} por página)
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingWordPress ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Cargando usuarios de WordPress...</div>
            </div>
          ) : !wordpressData || wordpressData.totalFiltered === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || selectedRole ? "No se encontraron usuarios" : "Sin usuarios de WordPress"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedRole 
                  ? "Intenta cambiar los filtros de búsqueda para ver más resultados"
                  : "No se encontraron usuarios en WordPress o la sincronización no está configurada."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Fecha de registro</TableHead>
                    <TableHead>URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(wordpressData?.paginatedUsers || wordpressData?.users || []).map((wpUser: any) => (
                    <TableRow key={wpUser.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                            <ExternalLink className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {wpUser.name || wpUser.first_name && wpUser.last_name 
                                ? `${wpUser.first_name || ''} ${wpUser.last_name || ''}`.trim()
                                : wpUser.username || wpUser.slug || 'Usuario sin nombre'
                              }
                            </p>
                            <p className="text-sm text-gray-500">
                              {wpUser.username ? `@${wpUser.username}` : `Slug: ${wpUser.slug}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={wpUser.email === 'No disponible' ? 'text-gray-400 italic' : ''}>
                          {wpUser.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {wpUser.roles && wpUser.roles.length > 0 ? (
                            wpUser.roles.map((role: string) => (
                              <div key={role} className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-semibold bg-white text-gray-700">
                                {role}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">Sin roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {wpUser.registered_date ? (
                          new Date(wpUser.registered_date).toLocaleDateString('es-ES')
                        ) : (
                          <span className="text-gray-400">No disponible</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {wpUser.username ? (
                          <a 
                            href={`https://anpr.org.mx/profile-2/?${wpUser.username}/`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            Ver perfil PeepSo
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">No disponible</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination Controls for WordPress Users */}
          {!isLoadingWordPress && wordpressData && wordpressData.totalPages > 1 && (
            <div className="border-t px-6 py-4 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * usersPerPage) + 1} a {Math.min(currentPage * usersPerPage, wordpressData.totalFiltered)} de {wordpressData.totalFiltered} usuarios
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                
                <span className="px-3 py-1 text-sm bg-white border rounded font-medium">
                  {currentPage} de {wordpressData.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, wordpressData.totalPages))}
                  disabled={currentPage === wordpressData.totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo del usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="usuario@email.com" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500">
                      El email no puede ser modificado ya que está vinculado a Firebase
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="representante">Representante</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-xs text-gray-500">
                      Administradores: Acceso completo al sistema<br/>
                      Representantes: Pueden gestionar empresas y comentarios<br/>
                      Usuarios: Acceso básico de lectura
                    </p>
                  </FormItem>
                )}
              />

              {editForm.watch("role") === "representante" && (
                <FormField
                  control={editForm.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa Asignada *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company: any) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.nombreEmpresa}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        El representante podrá gestionar únicamente esta empresa
                      </p>
                    </FormItem>
                  )}
                />
              )}

              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Actualizando..." : "Actualizar Usuario"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
