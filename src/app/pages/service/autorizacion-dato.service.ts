import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface AutorizacionDato {
    id?: number;
    descripcion: string;
    habilitado: boolean;
    estado_id?: number | null;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AutorizacionDatoService {
    private endpoint = 'autorizaciones-datos';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<AutorizacionDato[]> {
        return this.apiService.get<AutorizacionDato[]>(this.endpoint);
    }

    getById(id: number): Observable<AutorizacionDato> {
        return this.apiService.getById<AutorizacionDato>(this.endpoint, id);
    }

    create(autorizacion: Partial<AutorizacionDato>): Observable<AutorizacionDato> {
        return this.apiService.post<AutorizacionDato>(this.endpoint, autorizacion);
    }

    update(id: number, autorizacion: Partial<AutorizacionDato>): Observable<AutorizacionDato> {
        return this.apiService.put<AutorizacionDato>(this.endpoint, id, autorizacion);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
