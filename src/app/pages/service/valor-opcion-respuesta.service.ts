import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export interface ValorOpcionRespuesta {
    id?: number;
    respuesta_id?: number | null;
    opcion_id?: number | null;
    estado_id?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface CreateValorOpcionRespuestaPayload {
    respuesta_id?: number | null;
    opcion_id?: number | null;
    estado_id?: number | null;
}

@Injectable({
    providedIn: 'root'
})
export class ValorOpcionRespuestaService {
    private endpoint = 'valores-opciones-respuesta';

    constructor(private apiService: ApiService) {}

    getValores(): Observable<ValorOpcionRespuesta[]> {
        return this.apiService.get<ValorOpcionRespuesta[]>(this.endpoint);
    }

    getValorById(id: number): Observable<ValorOpcionRespuesta> {
        return this.apiService.getById<ValorOpcionRespuesta>(this.endpoint, id);
    }

    createValor(payload: CreateValorOpcionRespuestaPayload): Observable<ValorOpcionRespuesta> {
        return this.apiService.post<ValorOpcionRespuesta>(this.endpoint, payload as object);
    }

    updateValor(id: number, payload: Partial<CreateValorOpcionRespuestaPayload>): Observable<ValorOpcionRespuesta> {
        return this.apiService.put<ValorOpcionRespuesta>(this.endpoint, id, payload as object);
    }

    deleteValor(id: number): Observable<void> {
        return this.apiService.delete<void>(this.endpoint, id);
    }
}
