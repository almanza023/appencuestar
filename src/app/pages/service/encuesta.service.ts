import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface Encuesta {
    id?: number;
    formulario_id?: number | null;
    hogar_id?: number | null;
    encuestador_id?: number | null;
    created_at?: string | null;
    estado_id?: number | null;
    updated_at?: string | null;
    hogar?: { id?: number; cedula?: string; nombre_persona?: string } | null;
    encuestador?: { id?: number; nombres?: string; nombre?: string; apellidos?: string; apellido?: string } | null;
    usuario?: { id?: number; nombres?: string; nombre?: string; apellidos?: string; apellido?: string } | null;
}

export interface CreateEncuestaPayload {
    formulario_id?: number | null;
    hogar_id?: number | null;
    encuestador_id?: number | null;
    estado_id?: number | null;
}

export interface EncuestaPdfResponse {
    encuesta_id: number;
    file_name: string;
    content_type: string;
    pdf_base64: string;
}

@Injectable({
    providedIn: 'root'
})
export class EncuestaService {
    private endpoint = 'encuestas';

    constructor(private apiService: ApiService) {}

    getEncuestas(): Observable<Encuesta[]> {
        return this.apiService.get<Encuesta[]>(this.endpoint);
    }

    getEncuestaById(id: number): Observable<Encuesta> {
        return this.apiService.getById<Encuesta>(this.endpoint, id);
    }

    createEncuesta(payload: CreateEncuestaPayload): Observable<Encuesta> {
        return this.apiService.post<Encuesta>(this.endpoint, payload as object);
    }

    updateEncuesta(id: number, payload: Partial<CreateEncuestaPayload>): Observable<Encuesta> {
        return this.apiService.put<Encuesta>(this.endpoint, id, payload as object);
    }

    deleteEncuesta(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }

    getPdf(id: number): Observable<EncuestaPdfResponse> {
        return this.apiService.get<EncuestaPdfResponse>(`${this.endpoint}/${id}/pdf`);
    }
}
