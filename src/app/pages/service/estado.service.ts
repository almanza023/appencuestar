import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface Estado {
    id?: number;
    nombre: string;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EstadoService {
    private endpoint = 'estados';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<Estado[]> {
        return this.apiService.get<Estado[]>(this.endpoint);
    }

    getById(id: number): Observable<Estado> {
        return this.apiService.getById<Estado>(this.endpoint, id);
    }

    create(estado: Partial<Estado>): Observable<Estado> {
        return this.apiService.post<Estado>(this.endpoint, estado);
    }

    update(id: number, estado: Partial<Estado>): Observable<Estado> {
        return this.apiService.put<Estado>(this.endpoint, id, estado);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
