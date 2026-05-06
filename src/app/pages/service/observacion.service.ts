import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface Observacion {
    id?: number;
    encuesta_id?: number | null;
    encuestador_id: number;
    manzana?: string | null;
    predio?: string | null;
    descripcion: string;
    estado_id: number;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ObservacionService {
    private endpoint = 'observaciones';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<Observacion[]> {
        return this.apiService.get<Observacion[]>(this.endpoint);
    }

    getById(id: number): Observable<Observacion> {
        return this.apiService.getById<Observacion>(this.endpoint, id);
    }

    create(observacion: Partial<Observacion>): Observable<Observacion> {
        return this.apiService.post<Observacion>(this.endpoint, observacion);
    }

    update(id: number, observacion: Partial<Observacion>): Observable<Observacion> {
        return this.apiService.put<Observacion>(this.endpoint, id, observacion);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
