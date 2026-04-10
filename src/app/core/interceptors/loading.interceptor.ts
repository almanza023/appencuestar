import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '@/app/core/services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const loadingService = inject(LoadingService);

    loadingService.show('Cargando...');

    return next(req).pipe(
        finalize(() => {
            loadingService.hide();
        })
    );
};
