import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Search,
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2,
  UserX,
  Mail,
  User,
  RefreshCw,
  Database,
  Code2,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenu } from '@/components/user-menu';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';

import { useUserRole } from '@/hooks/use-user-role';
import {
  useAsignacionesDeRolDeUsuarioList,
  useCreateAsignacionesDeRolDeUsuario,
  useUpdateAsignacionesDeRolDeUsuario,
  useDeleteAsignacionesDeRolDeUsuario,
} from '@/generated/hooks/use-asignaciones-de-rol-de-usuario';
import { useRolesDelSistemaList } from '@/generated/hooks/use-roles-del-sistema';
import type { AsignacionesDeRolDeUsuario } from '@/generated/models/asignaciones-de-rol-de-usuario-model';
import type { RolesDelSistema } from '@/generated/models/roles-del-sistema-model';
import { useEntraUsers } from '@/hooks/use-entra-users';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmployeePhotoAvatar } from '@/components/employee-photo-avatar';

type FilterRole = 'all' | string;
type FilterStatus = 'all' | 'active' | 'inactive';

export default function UsuariosPage() {
  const { isDeveloper, isSuperUser, isLoading: roleLoading } = useUserRole();
  const { data: asignaciones, isLoading } = useAsignacionesDeRolDeUsuarioList();
  const { data: roles, isLoading: rolesLoading } = useRolesDelSistemaList();
  const { entraUsers, progress, clearCacheAndReload } = useEntraUsers();
  const createMutation = useCreateAsignacionesDeRolDeUsuario();
  const updateMutation = useUpdateAsignacionesDeRolDeUsuario();
  const deleteMutation = useDeleteAsignacionesDeRolDeUsuario();

  const [isClearingCache, setIsClearingCache] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AsignacionesDeRolDeUsuario | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    asignacionesderoldeusuarionombre: '',
    correoelectrnico: '',
    estadoactivo: true,
    roldelsistemaId: '',
  });

  const [isEmployeeSelectOpen, setIsEmployeeSelectOpen] = useState(false);

  // Filtered users
  const filteredAsignaciones = useMemo(() => {
    if (!asignaciones) return [];
    return asignaciones.filter((a: AsignacionesDeRolDeUsuario) => {
      const matchesSearch =
        searchQuery === '' ||
        a.asignacionesderoldeusuarionombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.correoelectrnico.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || a.roldelsistema?.id === roleFilter;
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && a.estadoactivo) ||
        (statusFilter === 'inactive' && !a.estadoactivo);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [asignaciones, searchQuery, roleFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!asignaciones || !roles) return { total: 0, active: 0, inactive: 0, byRole: {} as Record<string, number> };
    
    const byRole: Record<string, number> = {};
    roles.forEach((r: RolesDelSistema) => {
      byRole[r.id] = asignaciones.filter((a: AsignacionesDeRolDeUsuario) => a.roldelsistema?.id === r.id && a.estadoactivo).length;
    });
    
    return {
      total: asignaciones.length,
      active: asignaciones.filter((a: AsignacionesDeRolDeUsuario) => a.estadoactivo).length,
      inactive: asignaciones.filter((a: AsignacionesDeRolDeUsuario) => !a.estadoactivo).length,
      byRole,
    };
  }, [asignaciones, roles]);

  const resetForm = () => {
    setFormData({
      asignacionesderoldeusuarionombre: '',
      correoelectrnico: '',
      estadoactivo: true,
      roldelsistemaId: roles?.[0]?.id || '',
    });
  };

  const handleCreate = async () => {
    if (!formData.asignacionesderoldeusuarionombre.trim() || !formData.correoelectrnico.trim()) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    if (!formData.roldelsistemaId) {
      toast.error('Debes seleccionar un rol');
      return;
    }

    const selectedRole = roles?.find((r: RolesDelSistema) => r.id === formData.roldelsistemaId);
    if (!selectedRole) {
      toast.error('Rol no válido');
      return;
    }

    try {
      await createMutation.mutateAsync({
        asignacionesderoldeusuarionombre: formData.asignacionesderoldeusuarionombre,
        correoelectrnico: formData.correoelectrnico,
        estadoactivo: formData.estadoactivo,
        fechadeasignacin: new Date().toISOString(),
        roldelsistema: {
          id: selectedRole.id,
          nombrederol: selectedRole.nombrederol,
        },
      });
      toast.success('Asignación de rol creada correctamente');
      setIsCreateOpen(false);
      resetForm();
    } catch {
      toast.error('Error al crear la asignación de rol');
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    if (!formData.asignacionesderoldeusuarionombre.trim() || !formData.correoelectrnico.trim()) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    const selectedRole = roles?.find((r: RolesDelSistema) => r.id === formData.roldelsistemaId);
    if (!selectedRole) {
      toast.error('Rol no válido');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedUser.id,
        changedFields: {
          asignacionesderoldeusuarionombre: formData.asignacionesderoldeusuarionombre,
          correoelectrnico: formData.correoelectrnico,
          estadoactivo: formData.estadoactivo,
          roldelsistema: {
            id: selectedRole.id,
            nombrederol: selectedRole.nombrederol,
          },
        },
      });
      toast.success('Asignación actualizada correctamente');
      setIsEditOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch {
      toast.error('Error al actualizar la asignación');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteMutation.mutateAsync(selectedUser.id);
      toast.success('Asignación eliminada correctamente');
      setIsDeleteOpen(false);
      setSelectedUser(null);
    } catch {
      toast.error('Error al eliminar la asignación');
    }
  };

  const openEditDialog = (asignacion: AsignacionesDeRolDeUsuario) => {
    setSelectedUser(asignacion);
    setFormData({
      asignacionesderoldeusuarionombre: asignacion.asignacionesderoldeusuarionombre,
      correoelectrnico: asignacion.correoelectrnico,
      estadoactivo: asignacion.estadoactivo,
      roldelsistemaId: asignacion.roldelsistema?.id || '',
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (asignacion: AsignacionesDeRolDeUsuario) => {
    setSelectedUser(asignacion);
    setIsDeleteOpen(true);
  };

  // Get role display info
  const getRoleDisplay = (rolNombre: string | undefined) => {
    const nombre = rolNombre?.toLowerCase();
    if (nombre === 'administrador' || nombre === 'admin') {
      return { icon: ShieldCheck, label: 'Administrador', variant: 'default' as const, color: 'primary' };
    }
    if (nombre === 'desarrollador' || nombre === 'developer') {
      return { icon: Code2, label: 'Desarrollador', variant: 'outline' as const, color: 'developer' };
    }
    return { icon: Shield, label: rolNombre || 'Operativo', variant: 'secondary' as const, color: 'secondary' };
  };

  // Access control - only admins can see this page
  if (roleLoading || isLoading || rolesLoading) {
    return <LoadingSkeleton />;
  }

  if (!isDeveloper) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
            <UserX className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Acceso Restringido</h2>
          <p className="text-muted-foreground max-w-md">
            No tienes permisos para acceder a esta sección. Solo los administradores pueden gestionar usuarios.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background w-full max-w-[100vw] overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="icon">
                <Link to="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-primary to-accent rounded-lg">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-base sm:text-lg font-bold whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>
                  <span className="lg:hidden">Roles</span>
                  <span className="hidden lg:inline">Asignaciones de Rol</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">

              {/* Cache Clear Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsClearingCache(true);
                      try {
                        await clearCacheAndReload();
                        toast.success('Caché limpiado, recargando datos frescos...');
                      } catch {
                        toast.error('Error al limpiar el caché');
                      } finally {
                        setIsClearingCache(false);
                      }
                    }}
                    disabled={isClearingCache || progress.isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4",
                      (isClearingCache || progress.isLoading) && "animate-spin"
                    )} />
                    <span className="hidden sm:inline">
                      {isClearingCache || progress.isLoading ? 'Recargando...' : 'Limpiar Caché'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Limpiar caché y recargar usuarios
                </TooltipContent>
              </Tooltip>
              <Button onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }} className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva Asignación</span>
              </Button>
              <div className="ml-1 pl-2 border-l border-border/40">
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Cache Status Banner - Shows when loading or just completed */}
        {(progress.isLoading || (progress.isComplete && isClearingCache)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {progress.statusMessage}
                </p>
                <div className="mt-2 h-2 bg-primary/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress.progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {progress.recordsLoaded.toLocaleString()} / ~{progress.expectedTotal.toLocaleString()} registros
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6"
        >
          <StatCard
            icon={Users}
            label="Total Asignaciones"
            value={stats.total}
            color="primary"
          />
          <StatCard
            icon={CheckCircle}
            label="Activas"
            value={stats.active}
            color="accent"
          />
          <StatCard
            icon={XCircle}
            label="Inactivas"
            value={stats.inactive}
            color="secondary"
          />
          <StatCard
            icon={Shield}
            label="Roles Disponibles"
            value={roles?.length || 0}
            color="developer"
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o correo..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(val: string) => setRoleFilter(val)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {roles?.filter((r: RolesDelSistema) => r.id).map((role: RolesDelSistema) => (
                <SelectItem key={role.id} value={role.id}>{role.nombrederol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(val: string) => setStatusFilter(val as FilterStatus)}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border/50 rounded-xl shadow-sm"
        >
          {filteredAsignaciones.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyTitle>No se encontraron asignaciones</EmptyTitle>
                <EmptyDescription>
                  {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Agrega la primera asignación de rol para comenzar'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[50%] lg:w-[28%]">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Usuario
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell lg:w-[25%]">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Correo electrónico
                    </div>
                  </TableHead>
                  <TableHead className="w-[35%] lg:w-[18%]">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Rol
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell lg:w-[14%]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Fecha
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell lg:w-[15%]">Estado</TableHead>
                  <TableHead className="w-[15%] lg:w-[8%] text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredAsignaciones.map((asignacion: AsignacionesDeRolDeUsuario, index: number) => {
                    const roleDisplay = getRoleDisplay(asignacion.roldelsistema?.nombrederol);
                    const RoleIcon = roleDisplay.icon;
                    return (
                      <motion.tr
                        key={asignacion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <EmployeePhotoAvatar 
                              employeeName={asignacion.asignacionesderoldeusuarionombre} 
                              employeeEmail={asignacion.correoelectrnico} 
                              className="h-9 w-9 shadow-md"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{asignacion.asignacionesderoldeusuarionombre}</p>
                              <p className="text-xs text-muted-foreground lg:hidden truncate">{asignacion.correoelectrnico}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground truncate block">{asignacion.correoelectrnico}</span>
                        </TableCell>
                        <TableCell>
                          {roleDisplay.color === 'developer' ? (
                            <Badge variant="outline" className="gap-1 border-emerald-500/50 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400">
                              <RoleIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{roleDisplay.label}</span>
                            </Badge>
                          ) : (
                            <Badge variant={roleDisplay.variant} className="gap-1">
                              <RoleIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{roleDisplay.label}</span>
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {asignacion.fechadeasignacin 
                              ? format(new Date(asignacion.fechadeasignacin), 'dd MMM yyyy', { locale: es })
                              : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {asignacion.estadoactivo ? (
                            <Badge variant="outline" className="gap-1 border-emerald-500/50 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400">
                              <CheckCircle className="h-3 w-3" />
                              <span className="hidden sm:inline">Activo</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 border-red-500/50 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400">
                              <XCircle className="h-3 w-3" />
                              <span className="hidden sm:inline">Inactivo</span>
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            {(() => {
                              const isProtectedRow = 
                                asignacion.correoelectrnico === 'admin@demo.com' || 
                                asignacion.correoelectrnico === 'operativo@demo.com' ||
                                asignacion.correoelectrnico === 'desarrollador@demo.com';
                              
                              if (isProtectedRow && !isSuperUser) {
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-muted-foreground opacity-50 cursor-not-allowed">
                                        <Shield className="h-4 w-4" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">Protegido</TooltipContent>
                                  </Tooltip>
                                );
                              }

                              return (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditDialog(asignacion)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openDeleteDialog(asignacion)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              );
                            })()}
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </motion.div>
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Nueva Asignación de Rol
            </DialogTitle>
            <DialogDescription>
              Asigna un rol del sistema a un usuario mediante su correo electrónico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="correo">Empleado</Label>
              <Popover open={isEmployeeSelectOpen} onOpenChange={setIsEmployeeSelectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isEmployeeSelectOpen}
                    className="w-full justify-between"
                  >
                    {formData.correoelectrnico
                      ? entraUsers.find((u) => u.correo === formData.correoelectrnico)?.nombreparamostrar || formData.correoelectrnico
                      : "Buscar empleado..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Empieza a escribir un nombre o correo..." />
                    <CommandList>
                      <CommandEmpty>No se encontró ningún empleado.</CommandEmpty>
                      <CommandGroup>
                        {entraUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.nombreparamostrar} ${user.correo}`}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                correoelectrnico: user.correo || '',
                                asignacionesderoldeusuarionombre: user.nombreparamostrar || '',
                              });
                              setIsEmployeeSelectOpen(false);
                            }}
                            className="flex items-center gap-3 py-2.5 cursor-pointer"
                          >
                            <EmployeePhotoAvatar
                              employeeName={user.nombreparamostrar || ''}
                              employeeEmail={user.correo}
                              entraObjectId={user.id}
                              className="h-8 w-8 shrink-0"
                              enableLazyLoad={true}
                            />
                            <div className="flex flex-col flex-1 min-w-0 overflow-hidden text-left">
                              <span className="font-medium truncate text-sm leading-tight">
                                {user.nombreparamostrar}
                              </span>
                              {user.correo && (
                                <span className="text-xs text-muted-foreground truncate block">
                                  {user.correo}
                                </span>
                              )}
                            </div>
                            {formData.correoelectrnico === user.correo && (
                              <Check className="h-4 w-4 text-orange-500 shrink-0" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol del sistema</Label>
              <Select
                value={formData.roldelsistemaId}
                onValueChange={(val: string) =>
                  setFormData({ ...formData, roldelsistemaId: val })
                }
              >
                <SelectTrigger id="rol">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.filter((r: RolesDelSistema) => {
                    const isDevRole = r.nombrederol?.toLowerCase() === 'desarrollador';
                    return !isDevRole || isDeveloper || isSuperUser;
                  }).map((role: RolesDelSistema) => {
                    const display = getRoleDisplay(role.nombrederol);
                    const RoleIcon = display.icon;
                    return (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <RoleIcon className="h-4 w-4" />
                          {role.nombrederol}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="activo">Estado activo</Label>
                <p className="text-xs text-muted-foreground">El usuario tendrá acceso inmediato</p>
              </div>
              <Switch
                id="activo"
                checked={formData.estadoactivo}
                onCheckedChange={(checked: boolean) =>
                  setFormData({ ...formData, estadoactivo: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creando...' : 'Crear Asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Asignación
            </DialogTitle>
            <DialogDescription>
              Modifica la información de la asignación seleccionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-correo">Empleado</Label>
              <Popover open={isEmployeeSelectOpen} onOpenChange={setIsEmployeeSelectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isEmployeeSelectOpen}
                    className="w-full justify-between"
                  >
                    {formData.correoelectrnico
                      ? entraUsers.find((u) => u.correo === formData.correoelectrnico)?.nombreparamostrar || formData.correoelectrnico
                      : "Buscar empleado..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Empieza a escribir un nombre o correo..." />
                    <CommandList>
                      <CommandEmpty>No se encontró ningún empleado.</CommandEmpty>
                      <CommandGroup>
                        {entraUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.nombreparamostrar} ${user.correo}`}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                correoelectrnico: user.correo || '',
                                asignacionesderoldeusuarionombre: user.nombreparamostrar || '',
                              });
                              setIsEmployeeSelectOpen(false);
                            }}
                            className="flex items-center gap-3 py-2.5 cursor-pointer"
                          >
                            <EmployeePhotoAvatar
                              employeeName={user.nombreparamostrar || ''}
                              employeeEmail={user.correo}
                              entraObjectId={user.id}
                              className="h-8 w-8 shrink-0"
                              enableLazyLoad={true}
                            />
                            <div className="flex flex-col flex-1 min-w-0 overflow-hidden text-left">
                              <span className="font-medium truncate text-sm leading-tight">
                                {user.nombreparamostrar}
                              </span>
                              {user.correo && (
                                <span className="text-xs text-muted-foreground truncate block">
                                  {user.correo}
                                </span>
                              )}
                            </div>
                            {formData.correoelectrnico === user.correo && (
                              <Check className="h-4 w-4 text-orange-500 shrink-0" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-rol">Rol del sistema</Label>
              <Select
                value={formData.roldelsistemaId}
                onValueChange={(val: string) =>
                  setFormData({ ...formData, roldelsistemaId: val })
                }
              >
                <SelectTrigger id="edit-rol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles?.filter((r: RolesDelSistema) => {
                    const isDevRole = r.nombrederol?.toLowerCase() === 'desarrollador';
                    return !isDevRole || isDeveloper || isSuperUser;
                  }).map((role: RolesDelSistema) => {
                    const display = getRoleDisplay(role.nombrederol);
                    const RoleIcon = display.icon;
                    return (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <RoleIcon className="h-4 w-4" />
                          {role.nombrederol}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-activo">Estado activo</Label>
                <p className="text-xs text-muted-foreground">Desactivar revocará el acceso</p>
              </div>
              <Switch
                id="edit-activo"
                checked={formData.estadoactivo}
                onCheckedChange={(checked: boolean) =>
                  setFormData({ ...formData, estadoactivo: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Eliminar Asignación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la asignación de{' '}
              <strong>{selectedUser?.asignacionesderoldeusuarionombre}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// Color configurations for stat cards
const STAT_CARD_COLORS = {
  primary: {
    gradient: 'from-primary/12 via-primary/6 to-primary/2',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    border: 'border-primary/25',
    decorGlow: 'bg-primary/25',
  },
  accent: {
    gradient: 'from-accent/15 via-accent/8 to-accent/3',
    iconBg: 'bg-accent/18',
    iconColor: 'text-accent',
    border: 'border-accent/30',
    decorGlow: 'bg-accent/30',
  },
  secondary: {
    gradient: 'from-primary/10 via-accent/6 to-primary/3',
    iconBg: 'bg-primary/12',
    iconColor: 'text-primary',
    border: 'border-primary/20',
    decorGlow: 'bg-primary/20',
  },
  developer: {
    gradient: 'from-emerald-500/12 via-emerald-500/6 to-teal-500/2',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/25',
    decorGlow: 'bg-emerald-500/25',
  },
};

// Enhanced Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: 'primary' | 'accent' | 'secondary' | 'developer';
}) {
  const colors = STAT_CARD_COLORS[color];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-4 sm:p-5',
            'transition-all duration-300 ease-out',
            'bg-card/70 backdrop-blur-sm',
            'hover:shadow-lg hover:border-border',
            colors.gradient,
            colors.border
          )}
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-1 sm:gap-0">
            <div className={cn(
              'p-2 rounded-xl transition-all duration-300 sm:order-2',
              colors.iconBg
            )}>
              <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', colors.iconColor)} />
            </div>
            
            <div className="text-center sm:text-left sm:order-1">
              <p className="hidden sm:block text-[10px] sm:text-xs text-muted-foreground font-medium tracking-wide uppercase">
                {label}
              </p>
              <motion.p
                key={value}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="text-xl sm:text-3xl font-bold sm:mt-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {value}
              </motion.p>
            </div>
          </div>

          {/* Decorative corner accent */}
          <div className={cn(
            'absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-40',
            colors.decorGlow
          )} />
          
          {/* Subtle shine effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </TooltipTrigger>
      <TooltipContent className="sm:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="bg-background w-full">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </header>
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4].map((i: number) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-muted/30 p-3">
            <div className="flex gap-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-48 hidden sm:block" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((i: number) => (
            <div key={i} className="p-3 border-t border-border/30">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
