import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Formulario, FormularioService, PreguntaFormulario, SeccionFormulario, TipoPregunta } from '@/app/pages/service/formulario.service';
import { Encuesta, EncuestaService } from '@/app/pages/service/encuesta.service';
import { Respuesta, RespuestaService } from '@/app/pages/service/respuesta.service';
import { ValorOpcionRespuesta, ValorOpcionRespuestaService } from '@/app/pages/service/valor-opcion-respuesta.service';

type AnswerValue = string | number | boolean | number[] | null;
type InputControlType = 'select' | 'multiselect' | 'textarea' | 'number' | 'checkbox' | 'date' | 'text';
type QuestionOptionView = { label: string; value: number; rawValue: string; isOther: boolean };

@Component({
    selector: 'app-encuesta-editar',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        MultiSelectModule,
        CheckboxModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
                <h2 class="m-0 text-2xl font-bold">Editar Respuestas de Encuesta</h2>
                <p class="m-0 text-surface-500 dark:text-surface-400">
                    @if (encuesta()) {
                        Encuesta #{{ encuesta()?.id }} &mdash; Formulario: {{ formulario()?.codigo }} {{ formulario()?.nombre }}
                    }
                </p>
            </div>
            <div class="flex gap-2">
                <p-button label="Volver" icon="pi pi-arrow-left" [outlined]="true" (onClick)="goBack()"></p-button>
                <p-button label="Guardar cambios" icon="pi pi-save" severity="success" [loading]="saving()" (onClick)="saveAnswers()"></p-button>
            </div>
        </div>

        @if (savedOk()) {
            <div class="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-800 dark:bg-green-950/20 dark:text-green-100">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div class="text-sm font-semibold uppercase tracking-wide">Cambios guardados</div>
                        <div class="mt-1 text-sm opacity-80">Las respuestas de la encuesta #{{ encuesta()?.id }} han sido actualizadas correctamente.</div>
                    </div>
                    <p-button label="Volver al listado" icon="pi pi-list" [outlined]="true" (onClick)="goBack()"></p-button>
                </div>
            </div>
        }

        @if (loading()) {
            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">Cargando encuesta...</div>
        } @else if (!formulario()) {
            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">No se encontró el formulario asociado a esta encuesta.</div>
        } @else {
            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 mb-5">
                <div class="text-sm text-surface-500 dark:text-surface-400">{{ formulario()?.codigo }} - v{{ formulario()?.version || '1.0' }}</div>
                <h3 class="m-0 mt-1 text-xl font-semibold">{{ formulario()?.nombre }}</h3>
                <p class="m-0 mt-2 text-surface-600 dark:text-surface-300">{{ formulario()?.descripcion || 'Sin descripcion' }}</p>
            </div>

            @for (seccion of secciones(); track seccion.id || seccion.orden) {
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 mb-5">
                    <div class="mb-4">
                        <h4 class="m-0 text-lg font-semibold">{{ seccion.orden }}. {{ seccion.titulo }}</h4>
                        @if (seccion.descripcion) {
                            <p class="m-0 mt-1 text-sm text-surface-500 dark:text-surface-400">{{ seccion.descripcion }}</p>
                        }
                    </div>

                    @for (pregunta of visibleQuestions(seccion); track pregunta.id || pregunta.orden) {
                        <div class="mb-5 pb-4 border-b border-surface-200 dark:border-surface-700 last:border-b-0 last:pb-0">
                            <label class="block mb-2 font-semibold">
                                {{ pregunta.orden }}. {{ pregunta.etiqueta }}
                                @if (pregunta.requerida) {
                                    <span class="text-red-500">*</span>
                                }
                            </label>

                            @if (pregunta.texto_ayuda) {
                                <small class="block mb-2 text-surface-500 dark:text-surface-400">{{ pregunta.texto_ayuda }}</small>
                            }

                            @switch (resolveControl(pregunta)) {
                                @case ('select') {
                                    <p-select
                                        appendTo="body"
                                        [options]="questionOptions(pregunta)"
                                        optionLabel="label"
                                        optionValue="value"
                                        [ngModel]="getAnswer(pregunta.id)"
                                        (ngModelChange)="setAnswer(pregunta.id, $event)"
                                        [placeholder]="pregunta.placeholder || 'Selecciona una opcion'"
                                        [showClear]="true"
                                        [filter]="questionOptions(pregunta).length > 8"
                                        fluid
                                    ></p-select>
                                }
                                @case ('multiselect') {
                                    <p-multiselect
                                        appendTo="body"
                                        [options]="questionOptions(pregunta)"
                                        optionLabel="label"
                                        optionValue="value"
                                        [ngModel]="multiAnswer(pregunta.id)"
                                        (ngModelChange)="setMultiAnswer(pregunta.id, $event)"
                                        [placeholder]="pregunta.placeholder || 'Selecciona una o varias opciones'"
                                        [filter]="questionOptions(pregunta).length > 8"
                                        display="chip"
                                        class="w-full"
                                    ></p-multiselect>
                                }
                                @case ('textarea') {
                                    <textarea
                                        pTextarea
                                        rows="3"
                                        class="w-full"
                                        [placeholder]="pregunta.placeholder || ''"
                                        [ngModel]="stringAnswer(pregunta.id)"
                                        (ngModelChange)="setAnswer(pregunta.id, $event)"
                                    ></textarea>
                                }
                                @case ('number') {
                                    <input
                                        pInputText
                                        type="number"
                                        class="w-full"
                                        [placeholder]="pregunta.placeholder || ''"
                                        [min]="pregunta.valor_minimo ?? null"
                                        [max]="pregunta.valor_maximo ?? null"
                                        [ngModel]="numberAnswer(pregunta.id)"
                                        (ngModelChange)="setAnswer(pregunta.id, normalizeNumber($event))"
                                    />
                                }
                                @case ('checkbox') {
                                    <div class="flex items-center gap-2">
                                        <p-checkbox
                                            [binary]="true"
                                            [ngModel]="booleanAnswer(pregunta.id)"
                                            (ngModelChange)="setAnswer(pregunta.id, $event)"
                                            [inputId]="'q-' + (pregunta.id || pregunta.orden)"
                                        ></p-checkbox>
                                        <label [for]="'q-' + (pregunta.id || pregunta.orden)">Sí</label>
                                    </div>
                                }
                                @case ('date') {
                                    <input
                                        pInputText
                                        type="date"
                                        class="w-full"
                                        [ngModel]="stringAnswer(pregunta.id)"
                                        (ngModelChange)="setAnswer(pregunta.id, $event)"
                                    />
                                }
                                @default {
                                    <input
                                        pInputText
                                        type="text"
                                        class="w-full"
                                        [placeholder]="pregunta.placeholder || ''"
                                        [maxlength]="pregunta.longitud_maxima ?? null"
                                        [ngModel]="stringAnswer(pregunta.id)"
                                        (ngModelChange)="setAnswer(pregunta.id, $event)"
                                    />
                                }
                            }

                            @if (pregunta.permite_otro && isOtherSelected(pregunta)) {
                                <div class="mt-2">
                                    <input
                                        pInputText
                                        type="text"
                                        class="w-full"
                                        [placeholder]="pregunta.etiqueta_otro || 'Especifica otro valor'"
                                        [ngModel]="otherAnswer(pregunta.id)"
                                        (ngModelChange)="setOtherAnswer(pregunta.id, $event)"
                                    />
                                </div>
                            }

                            @if (submitted() && isRequiredInvalid(pregunta)) {
                                <small class="text-red-500">Esta pregunta es requerida.</small>
                            }
                        </div>
                    }
                </div>
            }

            <div class="flex justify-end gap-2 mt-4">
                <p-button label="Volver" icon="pi pi-arrow-left" [outlined]="true" (onClick)="goBack()"></p-button>
                <p-button label="Guardar cambios" icon="pi pi-save" severity="success" [loading]="saving()" (onClick)="saveAnswers()"></p-button>
            </div>
        }
    `
})
export class EncuestaEditar implements OnInit {
    encuesta = signal<Encuesta | null>(null);
    formulario = signal<Formulario | null>(null);
    secciones = signal<SeccionFormulario[]>([]);
    loading = signal(false);
    saving = signal(false);
    submitted = signal(false);
    savedOk = signal(false);

    private tiposPreguntaById = new Map<number, string>();
    private answersMap = signal<Record<number, AnswerValue>>({});
    private otherAnswersMap = signal<Record<number, string>>({});
    private existingRespuestasById = new Map<number, Respuesta>(); // pregunta_id → Respuesta
    private existingValoresMap = new Map<number, ValorOpcionRespuesta[]>(); // respuesta_id → valores

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private encuestaService: EncuestaService,
        private formularioService: FormularioService,
        private respuestaService: RespuestaService,
        private valorOpcionRespuestaService: ValorOpcionRespuestaService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        void this.loadPage();
    }

    async loadPage() {
        this.loading.set(true);
        try {
            const idParam = this.route.snapshot.paramMap.get('id');
            const id = Number(idParam);

            if (!id || Number.isNaN(id)) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID de encuesta inválido.', life: 4000 });
                this.loading.set(false);
                return;
            }

            const encuesta = await firstValueFrom(this.encuestaService.getEncuestaById(id));
            this.encuesta.set(encuesta);

            if (!encuesta.formulario_id) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Esta encuesta no tiene formulario asociado.', life: 4000 });
                this.loading.set(false);
                return;
            }

            const [tiposPregunta, formulario, todasRespuestas, todosValores] = await Promise.all([
                firstValueFrom(this.formularioService.getTiposPregunta()).catch(() => [] as TipoPregunta[]),
                firstValueFrom(this.formularioService.getFormularioById(encuesta.formulario_id)),
                firstValueFrom(this.respuestaService.getRespuestas()),
                firstValueFrom(this.valorOpcionRespuestaService.getValores())
            ]);

            this.tiposPreguntaById = new Map(tiposPregunta.map((t) => [t.id, (t.nombre || '').toLowerCase()]));
            this.formulario.set(formulario);

            const seccionesOrdenadas = [...(formulario.secciones ?? [])]
                .filter((s) => s.visible)
                .sort((a, b) => a.orden - b.orden)
                .map((s) => ({
                    ...s,
                    preguntas: [...(s.preguntas ?? [])].sort((a, b) => a.orden - b.orden)
                }));
            this.secciones.set(seccionesOrdenadas);

            // Construir lookup de respuestas existentes (pregunta_id → Respuesta)
            const respuestasEncuesta = todasRespuestas.filter((r) => r.encuesta_id == id);
            this.existingRespuestasById.clear();
            for (const r of respuestasEncuesta) {
                if (r.pregunta_id) {
                    this.existingRespuestasById.set(r.pregunta_id, r);
                }
            }

            // Construir lookup de valores de opciones (respuesta_id → ValorOpcionRespuesta[])
            const respuestaIds = new Set(respuestasEncuesta.map((r) => r.id).filter((rid): rid is number => !!rid));
            const valoresEncuesta = todosValores.filter((v) => !!v.respuesta_id && respuestaIds.has(v.respuesta_id));
            this.existingValoresMap.clear();
            for (const v of valoresEncuesta) {
                if (!v.respuesta_id) continue;
                if (!this.existingValoresMap.has(v.respuesta_id)) {
                    this.existingValoresMap.set(v.respuesta_id, []);
                }
                this.existingValoresMap.get(v.respuesta_id)!.push(v);
            }

            // Pre-cargar respuestas en el formulario
            this.prefillAnswers(seccionesOrdenadas.flatMap((s) => s.preguntas ?? []));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la encuesta.', life: 4000 });
        } finally {
            this.loading.set(false);
        }
    }

    private prefillAnswers(preguntas: PreguntaFormulario[]) {
        const newAnswers: Record<number, AnswerValue> = {};
        const newOther: Record<number, string> = {};

        for (const pregunta of preguntas) {
            if (!pregunta.id) continue;
            const respuesta = this.existingRespuestasById.get(pregunta.id);
            if (!respuesta?.id) continue;

            const valores = this.existingValoresMap.get(respuesta.id) ?? [];

            if (valores.length > 0) {
                const opcionIds = valores.map((v) => v.opcion_id).filter((oid): oid is number => !!oid);
                if (this.isMultipleChoice(pregunta)) {
                    newAnswers[pregunta.id] = opcionIds;
                } else {
                    newAnswers[pregunta.id] = opcionIds[0] ?? null;
                }
                // Si hay opción "otro", recuperar el texto libre del valor_texto
                const tieneOtroSeleccionado = (pregunta.opciones ?? []).some((o) => o.es_otro && o.id && opcionIds.includes(o.id));
                if (tieneOtroSeleccionado && respuesta.valor_texto) {
                    newOther[pregunta.id] = respuesta.valor_texto;
                }
            } else if (respuesta.valor_texto != null && respuesta.valor_texto !== '') {
                const tipoName = this.tiposPreguntaById.get(pregunta.tipo_pregunta_id) ?? '';
                if (tipoName.includes('boolean') || tipoName.includes('si/no') || tipoName.includes('check')) {
                    newAnswers[pregunta.id] = respuesta.valor_texto === 'SI';
                } else if (tipoName.includes('numero') || tipoName.includes('numerica') || tipoName.includes('entero') || tipoName.includes('decimal')) {
                    const num = Number(respuesta.valor_texto);
                    newAnswers[pregunta.id] = Number.isFinite(num) ? num : respuesta.valor_texto;
                } else {
                    newAnswers[pregunta.id] = respuesta.valor_texto;
                }
            }
        }

        this.answersMap.set(newAnswers);
        this.otherAnswersMap.set(newOther);
    }

    async saveAnswers() {
        this.submitted.set(true);
        this.savedOk.set(false);

        const questions = this.secciones().flatMap((s) => this.visibleQuestions(s));
        const hasInvalid = questions.some((q) => this.isRequiredInvalid(q));

        if (hasInvalid) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Completa las preguntas requeridas.', life: 3500 });
            return;
        }

        const encuesta = this.encuesta();
        if (!encuesta?.id) return;

        this.saving.set(true);
        try {
            for (const pregunta of questions.filter((q) => !!q.id)) {
                const valorTexto = this.buildValorTexto(pregunta);
                const existingRespuesta = this.existingRespuestasById.get(pregunta.id!);

                let respuestaId: number;

                if (existingRespuesta?.id) {
                    await firstValueFrom(this.respuestaService.updateRespuesta(existingRespuesta.id, { valor_texto: valorTexto }));
                    respuestaId = existingRespuesta.id;
                } else {
                    const newRespuesta = await firstValueFrom(
                        this.respuestaService.createRespuesta({
                            encuesta_id: encuesta.id,
                            pregunta_id: pregunta.id,
                            valor_texto: valorTexto,
                            estado_id: 1
                        })
                    );
                    respuestaId = newRespuesta.id!;
                    this.existingRespuestasById.set(pregunta.id!, newRespuesta);
                    this.existingValoresMap.set(respuestaId, []);
                }

                // Eliminar valores de opciones anteriores
                const existingValores = this.existingValoresMap.get(respuestaId) ?? [];
                for (const val of existingValores) {
                    if (val.id) {
                        await firstValueFrom(this.valorOpcionRespuestaService.deleteValor(val.id));
                    }
                }
                this.existingValoresMap.set(respuestaId, []);

                // Crear nuevos valores de opciones seleccionadas
                const selectedOptionIds = this.getSelectedOptionIds(pregunta);
                for (const opcionId of selectedOptionIds) {
                    const newValor = await firstValueFrom(
                        this.valorOpcionRespuestaService.createValor({
                            respuesta_id: respuestaId,
                            opcion_id: opcionId,
                            estado_id: 1
                        })
                    );
                    this.existingValoresMap.get(respuestaId)!.push(newValor);
                }
            }

            this.savedOk.set(true);
            this.submitted.set(false);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Respuestas de encuesta #${encuesta.id} guardadas correctamente.`, life: 3500 });
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar las respuestas.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }

    visibleQuestions(seccion: SeccionFormulario): PreguntaFormulario[] {
        return (seccion.preguntas ?? []).filter((p) => p.visible);
    }

    questionOptions(pregunta: PreguntaFormulario): QuestionOptionView[] {
        return (pregunta.opciones ?? [])
            .filter((opt) => opt.activa && !!opt.id)
            .sort((a, b) => a.orden - b.orden)
            .map((opt) => ({
                label: opt.etiqueta,
                value: opt.id!,
                rawValue: opt.valor,
                isOther: opt.es_otro
            }));
    }

    resolveControl(pregunta: PreguntaFormulario): InputControlType {
        const hasOptions = this.questionOptions(pregunta).length > 0;
        if (hasOptions) {
            return this.isMultipleChoice(pregunta) ? 'multiselect' : 'select';
        }

        const tipoName = this.tiposPreguntaById.get(pregunta.tipo_pregunta_id) ?? '';

        if (tipoName.includes('textarea') || tipoName.includes('texto largo')) return 'textarea';
        if (tipoName.includes('numero') || tipoName.includes('numerica') || tipoName.includes('entero') || tipoName.includes('decimal')) return 'number';
        if (tipoName.includes('fecha')) return 'date';
        if (tipoName.includes('boolean') || tipoName.includes('si/no') || tipoName.includes('check')) return 'checkbox';

        return 'text';
    }

    isMultipleChoice(pregunta: PreguntaFormulario): boolean {
        const tipoName = this.tiposPreguntaById.get(pregunta.tipo_pregunta_id) ?? '';
        return tipoName.includes('multiple') || tipoName.includes('múltiple') || tipoName.includes('multi');
    }

    getAnswer(questionId?: number): AnswerValue {
        if (!questionId) return null;
        return this.answersMap()[questionId] ?? null;
    }

    stringAnswer(questionId?: number): string {
        const value = this.getAnswer(questionId);
        return typeof value === 'string' ? value : '';
    }

    numberAnswer(questionId?: number): number | null {
        const value = this.getAnswer(questionId);
        return typeof value === 'number' ? value : null;
    }

    multiAnswer(questionId?: number): number[] {
        const value = this.getAnswer(questionId);
        return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
    }

    booleanAnswer(questionId?: number): boolean | null {
        const value = this.getAnswer(questionId);
        return typeof value === 'boolean' ? value : null;
    }

    setAnswer(questionId: number | undefined, value: AnswerValue) {
        if (!questionId) return;
        this.answersMap.update((prev) => ({ ...prev, [questionId]: value }));
    }

    setMultiAnswer(questionId: number | undefined, value: number[] | null) {
        if (!questionId) return;
        this.answersMap.update((prev) => ({ ...prev, [questionId]: Array.isArray(value) ? value : [] }));
    }

    otherAnswer(questionId?: number): string {
        if (!questionId) return '';
        return this.otherAnswersMap()[questionId] ?? '';
    }

    setOtherAnswer(questionId: number | undefined, value: string) {
        if (!questionId) return;
        this.otherAnswersMap.update((prev) => ({ ...prev, [questionId]: value ?? '' }));
    }

    isOtherSelected(pregunta: PreguntaFormulario): boolean {
        const selectedValue = this.getAnswer(pregunta.id);
        if (selectedValue == null || selectedValue === '') return false;
        const selectedIds = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
        return selectedIds.some((selectedId) => {
            if (typeof selectedId !== 'number') return false;
            const selected = (pregunta.opciones ?? []).find((opt) => opt.id === selectedId);
            return !!selected?.es_otro;
        });
    }

    isRequiredInvalid(pregunta: PreguntaFormulario): boolean {
        if (!pregunta.requerida) return false;
        const value = this.getAnswer(pregunta.id);

        if (Array.isArray(value)) {
            if (value.length === 0) return true;
            if (pregunta.permite_otro && this.isOtherSelected(pregunta)) {
                return this.otherAnswer(pregunta.id).trim().length === 0;
            }
            return false;
        }

        if (typeof value === 'boolean') return value == null;

        const baseInvalid = value == null || `${value}`.trim().length === 0;
        if (baseInvalid) return true;

        if (pregunta.permite_otro && this.isOtherSelected(pregunta)) {
            return this.otherAnswer(pregunta.id).trim().length === 0;
        }

        return false;
    }

    normalizeNumber(value: unknown): number | null {
        if (value == null || value === '') return null;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
    }

    getSelectedOptionIds(pregunta: PreguntaFormulario): number[] {
        const value = this.answersMap()[pregunta.id!] ?? null;
        if (Array.isArray(value)) {
            return value.filter((item): item is number => typeof item === 'number');
        }
        return typeof value === 'number' ? [value] : [];
    }

    getQuestionOptionById(pregunta: PreguntaFormulario, optionId: number): QuestionOptionView | null {
        return this.questionOptions(pregunta).find((option) => option.value === optionId) ?? null;
    }

    buildValorTexto(pregunta: PreguntaFormulario): string | null {
        const value = this.getAnswer(pregunta.id);

        if (this.questionOptions(pregunta).length > 0) {
            if (pregunta.permite_otro && this.isOtherSelected(pregunta)) {
                const otro = this.otherAnswer(pregunta.id).trim();
                if (otro) return otro;
            }
            const selectedLabels = this.getSelectedOptionIds(pregunta)
                .map((optionId) => this.getQuestionOptionById(pregunta, optionId)?.rawValue ?? '')
                .filter((v) => v.trim().length > 0);
            return selectedLabels.length > 0 ? selectedLabels.join(', ') : null;
        }

        if (typeof value === 'boolean') return value ? 'SI' : 'NO';
        if (typeof value === 'number') return String(value);
        if (typeof value === 'string') {
            const normalized = value.trim();
            return normalized.length > 0 ? normalized : null;
        }

        return null;
    }

    goBack() {
        void this.router.navigate(['/pages/encuestas']);
    }
}
