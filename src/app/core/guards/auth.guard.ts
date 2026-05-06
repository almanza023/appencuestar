import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const validateSession = (): boolean => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && !authService.isSessionExpired()) {
        return true;
    }

    authService.logout();
    router.navigate(['/auth/login']);
    return false;
};

export const authGuard: CanActivateFn = () => validateSession();
export const authChildGuard: CanActivateChildFn = () => validateSession();

/** Guard que bloquea el acceso a rutas administrativas para roles restringidos.
 *  Si el usuario tiene un rol restringido se redirige a /pages/encuestas. */
export const roleGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isRolRestringido()) {
        return true;
    }

    router.navigate(['/pages/encuestas']);
    return false;
};
