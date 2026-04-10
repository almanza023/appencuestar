import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface Rol {
    id?: number;
    nombre: string;
    descripcion?: string | null;
    estado_id: number;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RolService {
    private endpoint = 'roles';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<Rol[]> {
        return this.apiService.get<Rol[]>(this.endpoint);
    }

    getById(id: number): Observable<Rol> {
        return this.apiService.getById<Rol>(this.endpoint, id);
    }

    create(rol: Partial<Rol>): Observable<Rol> {
        return this.apiService.post<Rol>(this.endpoint, rol);
    }

    update(id: number, rol: Partial<Rol>): Observable<Rol> {
        return this.apiService.put<Rol>(this.endpoint, id, rol);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
