import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface MunicipioRef {
    id: number;
    nombre: string;
    departamento_id: number;
    estado_id: number;
    departamento?: { id: number; nombre: string; estado_id: number };
}

export interface CentroPoblado {
    id?: number;
    municipio_id: number;
    nombre: string;
    estado_id?: number;
    created_at?: string;
    updated_at?: string;
    municipio?: MunicipioRef;
}

@Injectable({
    providedIn: 'root'
})
export class CentroPobladoService {
    private endpoint = 'centros-poblados';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<CentroPoblado[]> {
        return this.apiService.get<CentroPoblado[]>(this.endpoint);
    }

    getById(id: number): Observable<CentroPoblado> {
        return this.apiService.getById<CentroPoblado>(this.endpoint, id);
    }

    create(cp: Partial<CentroPoblado>): Observable<CentroPoblado> {
        return this.apiService.post<CentroPoblado>(this.endpoint, cp);
    }

    update(id: number, cp: Partial<CentroPoblado>): Observable<CentroPoblado> {
        return this.apiService.put<CentroPoblado>(this.endpoint, id, cp);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
