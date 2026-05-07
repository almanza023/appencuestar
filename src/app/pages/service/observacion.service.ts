import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface Observacion {
    id?: number;
    encuesta_id?: number | null;
    encuestador_id: number;
    departamento_id?: number | null;
    municipio_id?: number | null;
    centro_poblado_id?: number | null;
    manzana?: string | null;
    predio?: string | null;
    descripcion: string;
    estado_id: number;
    created_at?: string;
    updated_at?: string;
    encuestador?: { id: number; nombres: string; apellidos: string };
    departamento?: { id: number; nombre: string };
    municipio?: { id: number; nombre: string };
    centro_poblado?: { id: number; nombre: string };
    estado?: { id: number; nombre: string };
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
