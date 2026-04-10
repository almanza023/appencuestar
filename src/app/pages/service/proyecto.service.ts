import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export type EstadoProyecto = 'activo' | 'inactivo' | 'finalizado';

export interface Proyecto {
    id?: number;
    nombre: string;
    codigo: string;
    descripcion?: string | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    logo_ruta?: string | null;
    estado: EstadoProyecto;
    created_at?: string;
    updated_at?: string;
    formularios?: FormularioProyecto[];
}

export interface FormularioProyecto {
    id: number;
    proyecto_id: number;
    nombre: string;
    codigo: string;
    version: string;
    estado: string;
    created_at: string;
    updated_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProyectoService {
    private endpoint = 'proyectos';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<Proyecto[]> {
        return this.apiService.get<Proyecto[]>(this.endpoint);
    }

    getById(id: number): Observable<Proyecto> {
        return this.apiService.getById<Proyecto>(this.endpoint, id);
    }

    create(proyecto: Partial<Proyecto>): Observable<Proyecto> {
        return this.apiService.post<Proyecto>(this.endpoint, proyecto);
    }

    update(id: number, proyecto: Partial<Proyecto>): Observable<Proyecto> {
        return this.apiService.put<Proyecto>(this.endpoint, id, proyecto);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
