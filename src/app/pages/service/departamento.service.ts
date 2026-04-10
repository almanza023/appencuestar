import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface Departamento {
    id?: number;
    nombre: string;
    estado_id?: number;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class DepartamentoService {
    private endpoint = 'departamentos';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<Departamento[]> {
        return this.apiService.get<Departamento[]>(this.endpoint);
    }

    getById(id: number): Observable<Departamento> {
        return this.apiService.getById<Departamento>(this.endpoint, id);
    }

    create(departamento: Partial<Departamento>): Observable<Departamento> {
        return this.apiService.post<Departamento>(this.endpoint, departamento);
    }

    update(id: number, departamento: Partial<Departamento>): Observable<Departamento> {
        return this.apiService.put<Departamento>(this.endpoint, id, departamento);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
