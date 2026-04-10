import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface DepartamentoRef {
    id: number;
    nombre: string;
    estado_id: number;
}

export interface Municipio {
    id?: number;
    departamento_id: number;
    nombre: string;
    estado_id?: number;
    created_at?: string;
    updated_at?: string;
    departamento?: DepartamentoRef;
}

@Injectable({
    providedIn: 'root'
})
export class MunicipioService {
    private endpoint = 'municipios';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<Municipio[]> {
        return this.apiService.get<Municipio[]>(this.endpoint);
    }

    getById(id: number): Observable<Municipio> {
        return this.apiService.getById<Municipio>(this.endpoint, id);
    }

    create(municipio: Partial<Municipio>): Observable<Municipio> {
        return this.apiService.post<Municipio>(this.endpoint, municipio);
    }

    update(id: number, municipio: Partial<Municipio>): Observable<Municipio> {
        return this.apiService.put<Municipio>(this.endpoint, id, municipio);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
