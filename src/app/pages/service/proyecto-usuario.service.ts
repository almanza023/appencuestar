import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface ProyectoUsuario {
    id?: number;
    proyecto_id: number;
    usuario_id: number;
    estado_id: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProyectoUsuarioService {
    private endpoint = 'proyecto-usuario';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<ProyectoUsuario[]> {
        return this.apiService.get<ProyectoUsuario[]>(this.endpoint);
    }

    getById(id: number): Observable<ProyectoUsuario> {
        return this.apiService.getById<ProyectoUsuario>(this.endpoint, id);
    }

    create(relacion: Partial<ProyectoUsuario>): Observable<ProyectoUsuario> {
        return this.apiService.post<ProyectoUsuario>(this.endpoint, relacion);
    }

    update(id: number, relacion: Partial<ProyectoUsuario>): Observable<ProyectoUsuario> {
        return this.apiService.put<ProyectoUsuario>(this.endpoint, id, relacion);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
