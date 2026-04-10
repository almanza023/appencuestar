import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface CatalogoDetalle {
    id?: number;
    catalogo_id?: number;
    nombre: string;
    valor: string;
    created_at?: string;
    updated_at?: string;
}

export interface Catalogo {
    id?: number;
    nombre: string;
    codigo: string;
    descripcion?: string | null;
    detalles?: CatalogoDetalle[];
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CatalogoService {
    private endpoint = 'catalogos';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<Catalogo[]> {
        return this.apiService.get<Catalogo[]>(this.endpoint);
    }

    getById(id: number): Observable<Catalogo> {
        return this.apiService.getById<Catalogo>(this.endpoint, id);
    }

    getByCodigoConDetalles(codigo: string): Observable<Catalogo> {
        return this.apiService.get<Catalogo>(`${this.endpoint}/codigo/${codigo}/detalles`);
    }

    create(catalogo: Partial<Catalogo>): Observable<Catalogo> {
        return this.apiService.post<Catalogo>(this.endpoint, catalogo);
    }

    update(id: number, catalogo: Partial<Catalogo>): Observable<Catalogo> {
        return this.apiService.put<Catalogo>(this.endpoint, id, catalogo);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }

    getDetalles(catalogoId: number): Observable<CatalogoDetalle[]> {
        return this.apiService.get<CatalogoDetalle[]>(`${this.endpoint}/${catalogoId}/detalles`);
    }

    createDetalle(catalogoId: number, detalle: Partial<CatalogoDetalle>): Observable<CatalogoDetalle> {
        return this.apiService.post<CatalogoDetalle>(`${this.endpoint}/${catalogoId}/detalles`, detalle);
    }

    updateDetalle(catalogoId: number, detalleId: number, detalle: Partial<CatalogoDetalle>): Observable<CatalogoDetalle> {
        return this.apiService.put<CatalogoDetalle>(`${this.endpoint}/${catalogoId}/detalles`, detalleId, detalle);
    }

    deleteDetalle(catalogoId: number, detalleId: number): Observable<void> {
        return this.apiService.delete<void>(`${this.endpoint}/${catalogoId}/detalles`, detalleId);
    }
}
