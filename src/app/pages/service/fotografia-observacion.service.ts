import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface FotografiaObservacion {
    id?: number;
    observacion_id: number;
    ruta: string;
    estado_id: number;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class FotografiaObservacionService {
    private endpoint = 'fotografias-observaciones';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<FotografiaObservacion[]> {
        return this.apiService.get<FotografiaObservacion[]>(this.endpoint);
    }

    getById(id: number): Observable<FotografiaObservacion> {
        return this.apiService.getById<FotografiaObservacion>(this.endpoint, id);
    }

    create(fotografia: Partial<FotografiaObservacion>): Observable<FotografiaObservacion> {
        return this.apiService.post<FotografiaObservacion>(this.endpoint, fotografia);
    }

    createWithFormData(payload: Record<string, unknown>, imagen?: File): Observable<FotografiaObservacion> {
        const formData = this.buildFormData(payload, imagen);
        return this.apiService.postFormData<FotografiaObservacion>(this.endpoint, formData);
    }

    update(id: number, fotografia: Partial<FotografiaObservacion>): Observable<FotografiaObservacion> {
        return this.apiService.put<FotografiaObservacion>(this.endpoint, id, fotografia);
    }

    updateWithFormData(id: number, payload: Record<string, unknown>, imagen?: File): Observable<FotografiaObservacion> {
        const formData = this.buildFormData(payload, imagen);
        return this.apiService.putFormData<FotografiaObservacion>(this.endpoint, id, formData);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }

    private buildFormData(payload: Record<string, unknown>, imagen?: File): FormData {
        const formData = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
            if (value == undefined || value == null) {
                return;
            }

            formData.append(key, String(value));
        });

        if (imagen) {
            formData.append('imagen', imagen);
        }

        return formData;
    }
}
