import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface Usuario {
    id?: number;
    rol_id: number;
    nombres: string;
    apellidos: string;
    numero_documento: string;
    email: string;
    password?: string;
    estado_id: number;
    firma_cargada?: boolean | number | string | null;
    firma?: string | null;
    firma_url?: string | null;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private endpoint = 'usuarios';

    constructor(private apiService: ApiService) {}

    getAll(): Observable<Usuario[]> {
        return this.apiService.get<Usuario[]>(this.endpoint);
    }

    getById(id: number): Observable<Usuario> {
        return this.apiService.getById<Usuario>(this.endpoint, id);
    }

    create(usuario: Partial<Usuario>): Observable<Usuario> {
        return this.apiService.post<Usuario>(this.endpoint, usuario);
    }

    createWithFormData(payload: Record<string, unknown>, firma?: File): Observable<Usuario> {
        const formData = this.buildFormData(payload, firma);
        return this.apiService.postFormData<Usuario>(this.endpoint, formData);
    }

    update(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
        return this.apiService.put<Usuario>(this.endpoint, id, usuario);
    }

    updateWithFormData(id: number, payload: Record<string, unknown>, firma?: File): Observable<Usuario> {
        const formData = this.buildFormData(payload, firma);
        return this.apiService.putFormData<Usuario>(this.endpoint, id, formData);
    }

    uploadFirma(id: number, firma: File): Observable<Usuario> {
        const formData = new FormData();
        formData.append('firma', firma);
        return this.apiService.putFormData<Usuario>(this.endpoint, id, formData);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }

    private buildFormData(payload: Record<string, unknown>, firma?: File): FormData {
        const formData = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return;
            }

            if (typeof value === 'boolean') {
                formData.append(key, value ? '1' : '0');
                return;
            }

            formData.append(key, String(value));
        });

        if (firma) {
            formData.append('firma', firma);
        }

        return formData;
    }
}
