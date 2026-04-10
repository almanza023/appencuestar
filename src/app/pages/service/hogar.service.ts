import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface Hogar {
    id?: number;
    departamento_id: number;
    municipio_id: number;
    centro_poblado_id?: number | null;
    nombre_persona: string;
    cedula: string;
    direccion: string;
    telefono?: string | null;
    estrato?: string | null;
    tipo_vivienda?: string | null;
    edad?: number | null;
    sexo?: string | null;
    ocupacion?: string | null;
    ingreso?: number | string | null;
    created_at?: string;
    updated_at?: string;
    departamento?: { id: number; nombre?: string };
    municipio?: { id: number; nombre?: string; departamento_id?: number };
    centro_poblado?: { id: number; nombre?: string; municipio_id?: number };
}

@Injectable({
    providedIn: 'root'
})
export class HogarService {
    private endpoint = 'hogares';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<Hogar[]> {
        return this.apiService.get<Hogar[]>(this.endpoint);
    }

    getById(id: number): Observable<Hogar> {
        return this.apiService.getById<Hogar>(this.endpoint, id);
    }

    create(hogar: Partial<Hogar>): Observable<Hogar> {
        return this.apiService.post<Hogar>(this.endpoint, hogar);
    }

    update(id: number, hogar: Partial<Hogar>): Observable<Hogar> {
        return this.apiService.put<Hogar>(this.endpoint, id, hogar);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
