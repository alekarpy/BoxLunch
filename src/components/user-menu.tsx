import { useUser } from '@/hooks/use-user';
import { useUserRole } from '@/hooks/use-user-role';
import { UserPhotoAvatar } from '@/components/user-photo-avatar';
import { MicrosoftEntraIDService } from '@/generated/services/microsoft-entra-id-service';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Shield, LogOut } from 'lucide-react';

export function UserMenu() {
  const { data: user, isLoading: userLoading } = useUser();
  const { isSuperUser } = useUserRole();

  if (userLoading || !user) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  const photoUrl = MicrosoftEntraIDService.getPhotoUrl(user.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 md:pr-3 rounded-full hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50">
          <UserPhotoAvatar
            user={{
              nombreparamostrar: user.displayName,
              correo: user.mail,
              nombreprincipaldeusuario: user.userPrincipalName,
            }}
            photoUrl={photoUrl}
            className="h-8 w-8 border border-primary/20"
            fallbackClassName="text-[10px] font-bold"
          />
          <div className="flex flex-col items-start hidden md:flex">
            <span className="text-xs font-semibold leading-none">{user.displayName}</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
              {isSuperUser && <Shield className="h-2 w-2 text-primary" />}
              {user.userPrincipalName}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-2">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.userPrincipalName}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => {
            // Official logout via server to clear cookies and Microsoft session
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
            window.location.href = `${apiBaseUrl}/auth/logout`;
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
