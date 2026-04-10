import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';

export type EstadoFormulario = 'borrador' | 'revision' | 'publicado' | 'archivado';

export interface Formulario {
    id?: number;
    proyecto_id: number;
    nombre: string;
    codigo: string;
    descripcion?: string | null;
    version?: string | null;
    usa_firma_encuestado: boolean;
    usa_firma_encuestador: boolean;
    genera_pdf: boolean;
    estado: EstadoFormulario;
    created_at?: string;
    updated_at?: string;
    secciones?: SeccionFormulario[];
}

export interface SeccionFormulario {
    id?: number;
    formulario_id: number;
    titulo: string;
    descripcion?: string | null;
    orden: number;
    visible: boolean;
    preguntas?: PreguntaFormulario[];
}

export interface PreguntaFormulario {
    id?: number;
    seccion_id: number;
    tipo_pregunta_id: number;
    codigo: string;
    etiqueta: string;
    texto_ayuda?: string | null;
    placeholder?: string | null;
    requerida: boolean;
    visible: boolean;
    solo_lectura: boolean;
    orden: number;
    permite_otro: boolean;
    etiqueta_otro?: string | null;
    validacion_regex?: string | null;
    valor_minimo?: number | null;
    valor_maximo?: number | null;
    longitud_maxima?: number | null;
    mapeo_campo_fijo?: string | null;
    opciones?: OpcionPregunta[];
    reglas?: ReglaPregunta[];
}

export interface OpcionPregunta {
    id?: number;
    pregunta_id: number;
    valor: string;
    etiqueta: string;
    orden: number;
    activa: boolean;
    es_otro: boolean;
}

export interface ReglaPregunta {
    id?: number;
    pregunta_origen_id: number;
    pregunta_destino_id: number;
    operador: string;
    valor_esperado: string;
    accion: string;
    orden: number;
}

export interface TipoPregunta {
    id: number;
    nombre: string;
    codigo?: string;
    requiere_opciones?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class FormularioService {
    private formulariosEndpoint = 'formularios';
    private seccionesEndpoint = 'secciones-formulario';
    private preguntasEndpoint = 'preguntas';
    private opcionesEndpoint = 'opciones-pregunta';
    private reglasEndpoint = 'reglas-pregunta';
    private tiposPreguntaEndpoint = 'tipos-pregunta';

    constructor(private apiService: ApiService) {}

    getFormularios(): Observable<Formulario[]> {
        return this.apiService.get<Formulario[]>(this.formulariosEndpoint);
    }

    getFormularioById(id: number): Observable<Formulario> {
        return this.apiService.getById<Formulario>(this.formulariosEndpoint, id);
    }

    createFormulario(payload: Partial<Formulario>): Observable<Formulario> {
        return this.apiService.post<Formulario>(this.formulariosEndpoint, payload as object);
    }

    updateFormulario(id: number, payload: Partial<Formulario>): Observable<Formulario> {
        return this.apiService.put<Formulario>(this.formulariosEndpoint, id, payload as object);
    }

    deleteFormulario(id: number): Observable<void> {
        return this.apiService.delete<void>(this.formulariosEndpoint, id);
    }

    createSeccion(payload: Partial<SeccionFormulario>): Observable<SeccionFormulario> {
        return this.apiService.post<SeccionFormulario>(this.seccionesEndpoint, payload as object);
    }

    updateSeccion(id: number, payload: Partial<SeccionFormulario>): Observable<SeccionFormulario> {
        return this.apiService.put<SeccionFormulario>(this.seccionesEndpoint, id, payload as object);
    }

    deleteSeccion(id: number): Observable<void> {
        return this.apiService.delete<void>(this.seccionesEndpoint, id);
    }

    createPregunta(payload: Partial<PreguntaFormulario>): Observable<PreguntaFormulario> {
        return this.apiService.post<PreguntaFormulario>(this.preguntasEndpoint, payload as object);
    }

    updatePregunta(id: number, payload: Partial<PreguntaFormulario>): Observable<PreguntaFormulario> {
        return this.apiService.put<PreguntaFormulario>(this.preguntasEndpoint, id, payload as object);
    }

    deletePregunta(id: number): Observable<void> {
        return this.apiService.delete<void>(this.preguntasEndpoint, id);
    }

    createOpcion(payload: Partial<OpcionPregunta>): Observable<OpcionPregunta> {
        return this.apiService.post<OpcionPregunta>(this.opcionesEndpoint, payload as object);
    }

    updateOpcion(id: number, payload: Partial<OpcionPregunta>): Observable<OpcionPregunta> {
        return this.apiService.put<OpcionPregunta>(this.opcionesEndpoint, id, payload as object);
    }

    deleteOpcion(id: number): Observable<void> {
        return this.apiService.delete<void>(this.opcionesEndpoint, id);
    }

    createRegla(payload: Partial<ReglaPregunta>): Observable<ReglaPregunta> {
        return this.apiService.post<ReglaPregunta>(this.reglasEndpoint, payload as object);
    }

    updateRegla(id: number, payload: Partial<ReglaPregunta>): Observable<ReglaPregunta> {
        return this.apiService.put<ReglaPregunta>(this.reglasEndpoint, id, payload as object);
    }

    deleteRegla(id: number): Observable<void> {
        return this.apiService.delete<void>(this.reglasEndpoint, id);
    }

    getTiposPregunta(): Observable<TipoPregunta[]> {
        return this.apiService.get<TipoPregunta[]>(this.tiposPreguntaEndpoint);
    }
}
