import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface FotografiaObservacion {
    id?: number;
    observacion_id: number;
    ruta: string;
    estado_id: number;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class FotografiaObservacionService {
    private endpoint = 'fotografias-observaciones';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<FotografiaObservacion[]> {
        return this.apiService.get<FotografiaObservacion[]>(this.endpoint);
    }

    getById(id: number): Observable<FotografiaObservacion> {
        return this.apiService.getById<FotografiaObservacion>(this.endpoint, id);
    }

    create(fotografia: Partial<FotografiaObservacion>): Observable<FotografiaObservacion> {
        return this.apiService.post<FotografiaObservacion>(this.endpoint, fotografia);
    }

    update(id: number, fotografia: Partial<FotografiaObservacion>): Observable<FotografiaObservacion> {
        return this.apiService.put<FotografiaObservacion>(this.endpoint, id, fotografia);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
