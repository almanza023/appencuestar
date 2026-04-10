import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface Respuesta {
    id?: number;
    encuesta_id?: number | null;
    pregunta_id?: number | null;
    valor_texto?: string | null;
    estado_id?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface CreateRespuestaPayload {
    encuesta_id?: number | null;
    pregunta_id?: number | null;
    valor_texto?: string | null;
    estado_id?: number | null;
}

@Injectable({
    providedIn: 'root'
})
export class RespuestaService {
    private endpoint = 'respuestas';

    constructor(private apiService: ApiService) {}

    getRespuestas(): Observable<Respuesta[]> {
        return this.apiService.get<Respuesta[]>(this.endpoint);
    }

    getRespuestaById(id: number): Observable<Respuesta> {
        return this.apiService.getById<Respuesta>(this.endpoint, id);
    }

    createRespuesta(payload: CreateRespuestaPayload): Observable<Respuesta> {
        return this.apiService.post<Respuesta>(this.endpoint, payload as object);
    }

    updateRespuesta(id: number, payload: Partial<CreateRespuestaPayload>): Observable<Respuesta> {
        return this.apiService.put<Respuesta>(this.endpoint, id, payload as object);
    }

    deleteRespuesta(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
