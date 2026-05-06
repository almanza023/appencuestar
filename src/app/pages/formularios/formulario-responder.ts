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
import { AuthService } from '@/app/core/services/auth.service';
import { HogarService } from '@/app/pages/service/hogar.service';
import { EncuestaService } from '@/app/pages/service/encuesta.service';
import { DepartamentoSelectComponent } from '@/app/shared/components/departamento-select/departamento-select.component';
import { MunicipioSelectComponent } from '@/app/shared/components/municipio-select/municipio-select.component';
import { CentroPobladoSelectComponent } from '@/app/shared/components/centro-poblado-select/centro-poblado-select.component';
import { SexoSelectComponent } from '@/app/shared/components/sexo-select/sexo-select.component';
import { TipoViviendaSelectComponent } from '@/app/shared/components/tipo-vivienda-select/tipo-vivienda-select.component';
import { Formulario, FormularioService, PreguntaFormulario, SeccionFormulario, TipoPregunta } from '@/app/pages/service/formulario.service';
import { RespuestaService } from '@/app/pages/service/respuesta.service';
import { ValorOpcionRespuestaService } from '@/app/pages/service/valor-opcion-respuesta.service';

type AnswerValue = string | number | boolean | number[] | null;
type InputControlType = 'select' | 'multiselect' | 'textarea' | 'number' | 'checkbox' | 'date' | 'text';
type QuestionOptionView = { label: string; value: number; rawValue: string; isOther: boolean };

@Component({
    selector: 'app-formulario-responder',
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
        ToastModule,
        DepartamentoSelectComponent,
        MunicipioSelectComponent,
        CentroPobladoSelectComponent,
        SexoSelectComponent,
        TipoViviendaSelectComponent
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
                <h2 class="m-0 text-2xl font-bold">Responder Formulario</h2>
                <p class="m-0 text-surface-500 dark:text-surface-400">Diligencia cada pregunta visible y guarda las respuestas.</p>
            </div>
            <div class="flex gap-2">
                <p-button label="Volver" icon="pi pi-arrow-left" [outlined]="true" (onClick)="goBack()"></p-button>
                <p-button label="Enviar respuestas" icon="pi pi-send" severity="success" [loading]="saving()" (onClick)="submitAnswers()"></p-button>
            </div>
        </div>

        @if (encuestaCreadaId()) {
            <div class="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-800 dark:bg-green-950/20 dark:text-green-100">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div class="text-sm font-semibold uppercase tracking-wide">Encuesta guardada</div>
                        <div class="mt-1 text-lg font-bold">ID de encuesta: {{ encuestaCreadaId() }}</div>
                        <div class="mt-1 text-sm opacity-80">Las respuestas y sus opciones seleccionadas fueron registradas correctamente.</div>
                    </div>
                    <p-button label="Volver al listado" icon="pi pi-list" [outlined]="true" (onClick)="goBack()"></p-button>
                </div>
            </div>
        }

        @if (loading()) {
            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">Cargando formulario...</div>
        } @else if (!formulario()) {
            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">No se encontró el formulario.</div>
        } @else {
            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 mb-5">
                <div class="text-sm text-surface-500 dark:text-surface-400">{{ formulario()?.codigo }} - v{{ formulario()?.version || '1.0' }}</div>
                <h3 class="m-0 mt-1 text-xl font-semibold">{{ formulario()?.nombre }}</h3>
                <p class="m-0 mt-2 text-surface-600 dark:text-surface-300">{{ formulario()?.descripcion || 'Sin descripcion' }}</p>
            </div>

            @for (seccion of secciones(); track seccion.id || seccion.orden; let sectionIndex = $index) {
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 mb-5">
                    <div class="mb-4">
                        <h4 class="m-0 text-lg font-semibold">{{ seccion.orden }}. {{ seccion.titulo }}</h4>
                        @if (seccion.descripcion) {
                            <p class="m-0 mt-1 text-sm text-surface-500 dark:text-surface-400">{{ seccion.descripcion }}</p>
                        }
                    </div>

                    @if (sectionIndex == 0) {
                        <div class="mb-5 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20">
                            <div class="flex items-center justify-between gap-3 mb-3">
                                <div>
                                    <h5 class="m-0 text-base font-semibold">Información para creación del hogar</h5>
                                    <small class="text-surface-500 dark:text-surface-400">Este bloque se usa para crear el hogar al enviar el formulario.</small>
                                </div>
                                <div class="flex items-center gap-2">
                                    <p-checkbox [(ngModel)]="crearHogarAlEnviar" [binary]="true" inputId="crearHogarAlEnviar" />
                                    <label for="crearHogarAlEnviar">Crear hogar al enviar</label>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label class="block mb-2 font-semibold">Departamento <span class="text-red-500">*</span></label>
                                    <app-departamento-select [(ngModel)]="hogarDraft.departamento_id" (ngModelChange)="onDepartamentoChange($event)" />
                                    @if (submitted() && crearHogarAlEnviar && !hogarDraft.departamento_id) {
                                        <small class="text-red-500">Departamento requerido.</small>
                                    }
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Municipio <span class="text-red-500">*</span></label>
                                    <app-municipio-select
                                        [(ngModel)]="hogarDraft.municipio_id"
                                        [departamentoId]="hogarDraft.departamento_id ?? null"
                                        (ngModelChange)="onMunicipioChange($event)"
                                    />
                                    @if (submitted() && crearHogarAlEnviar && !hogarDraft.municipio_id) {
                                        <small class="text-red-500">Municipio requerido.</small>
                                    }
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Centro Poblado</label>
                                    <app-centro-poblado-select [(ngModel)]="hogarDraft.centro_poblado_id" [municipioId]="hogarDraft.municipio_id ?? null" />
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Nombre Persona <span class="text-red-500">*</span></label>
                                    <input pInputText class="w-full" [(ngModel)]="hogarDraft.nombre_persona" (ngModelChange)="hogarDraft.nombre_persona = toUpperText($event)" maxlength="150" />
                                    @if (submitted() && crearHogarAlEnviar && !hogarDraft.nombre_persona.trim()) {
                                        <small class="text-red-500">Nombre requerido.</small>
                                    }
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Cédula <span class="text-red-500">*</span></label>
                                    <input pInputText class="w-full" [(ngModel)]="hogarDraft.cedula" (ngModelChange)="hogarDraft.cedula = toUpperText($event)" maxlength="30" />
                                    @if (submitted() && crearHogarAlEnviar && !hogarDraft.cedula.trim()) {
                                        <small class="text-red-500">Cédula requerida.</small>
                                    }
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Dirección <span class="text-red-500">*</span></label>
                                    <input pInputText class="w-full" [(ngModel)]="hogarDraft.direccion" (ngModelChange)="hogarDraft.direccion = toUpperText($event)" maxlength="255" />
                                    @if (submitted() && crearHogarAlEnviar && !hogarDraft.direccion.trim()) {
                                        <small class="text-red-500">Dirección requerida.</small>
                                    }
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Teléfono</label>
                                    <input pInputText class="w-full" [(ngModel)]="hogarDraft.telefono" (ngModelChange)="hogarDraft.telefono = toUpperText($event)" maxlength="20" />
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Estrato</label>
                                    <input pInputText class="w-full" [(ngModel)]="hogarDraft.estrato" (ngModelChange)="hogarDraft.estrato = toUpperText($event)" maxlength="20" />
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Tipo Vivienda</label>
                                    <app-tipo-vivienda-select [(ngModel)]="hogarDraft.tipo_vivienda" />
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Edad</label>
                                    <input pInputText type="number" class="w-full" [(ngModel)]="hogarDraft.edad" />
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Sexo</label>
                                    <app-sexo-select [(ngModel)]="hogarDraft.sexo" />
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Ocupación</label>
                                    <input pInputText class="w-full" [(ngModel)]="hogarDraft.ocupacion" (ngModelChange)="hogarDraft.ocupacion = toUpperText($event)" maxlength="100" />
                                </div>

                                <div>
                                    <label class="block mb-2 font-semibold">Ingreso</label>
                                    <input pInputText type="number" class="w-full" [(ngModel)]="hogarDraft.ingreso" />
                                </div>
                            </div>
                        </div>
                    }

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
        }
    `
})
export class FormularioResponder implements OnInit {
    formulario = signal<Formulario | null>(null);
    secciones = signal<SeccionFormulario[]>([]);
    loading = signal(false);
    saving = signal(false);
    submitted = signal(false);
    encuestaCreadaId = signal<number | null>(null);

    private tiposPreguntaById = new Map<number, string>();
    private answers: Record<number, AnswerValue> = {};
    private otherAnswers: Record<number, string> = {};
    crearHogarAlEnviar = true;
    hogarDraft: {
        departamento_id: number | null;
        municipio_id: number | null;
        centro_poblado_id: number | null;
        nombre_persona: string;
        cedula: string;
        direccion: string;
        telefono: string;
        estrato: string;
        tipo_vivienda: string | null;
        edad: number | null;
        sexo: string | null;
        ocupacion: string;
        ingreso: number | null;
    } = {
        departamento_id: null,
        municipio_id: null,
        centro_poblado_id: null,
        nombre_persona: '',
        cedula: '',
        direccion: '',
        telefono: '',
        estrato: '',
        tipo_vivienda: null,
        edad: null,
        sexo: null,
        ocupacion: '',
        ingreso: null
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private formularioService: FormularioService,
        private encuestaService: EncuestaService,
        private respuestaService: RespuestaService,
        private valorOpcionRespuestaService: ValorOpcionRespuestaService,
        private hogarService: HogarService,
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
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID de formulario inválido.', life: 4000 });
                this.loading.set(false);
                return;
            }

            const [tiposPregunta, formulario] = await Promise.all([
                firstValueFrom(this.formularioService.getTiposPregunta()).catch(() => [] as TipoPregunta[]),
                firstValueFrom(this.formularioService.getFormularioById(id))
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
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el formulario.', life: 4000 });
        } finally {
            this.loading.set(false);
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

        if (tipoName.includes('textarea') || tipoName.includes('texto largo')) {
            return 'textarea';
        }

        if (tipoName.includes('numero') || tipoName.includes('numerica') || tipoName.includes('entero') || tipoName.includes('decimal')) {
            return 'number';
        }

        if (tipoName.includes('fecha')) {
            return 'date';
        }

        if (tipoName.includes('boolean') || tipoName.includes('si/no') || tipoName.includes('check')) {
            return 'checkbox';
        }

        return 'text';
    }

    getAnswer(questionId?: number): AnswerValue {
        if (!questionId) return null;
        return this.answers[questionId] ?? null;
    }

    stringAnswer(questionId?: number): string {
        const value = this.getAnswer(questionId);
        return typeof value == 'string' ? value : '';
    }

    numberAnswer(questionId?: number): number | null {
        const value = this.getAnswer(questionId);
        return typeof value == 'number' ? value : null;
    }

    multiAnswer(questionId?: number): number[] {
        const value = this.getAnswer(questionId);
        return Array.isArray(value) ? value.filter((item): item is number => typeof item == 'number') : [];
    }

    booleanAnswer(questionId?: number): boolean | null {
        const value = this.getAnswer(questionId);
        return typeof value == 'boolean' ? value : null;
    }

    setAnswer(questionId: number | undefined, value: AnswerValue) {
        if (!questionId) return;
        this.answers = { ...this.answers, [questionId]: value };
    }

    setMultiAnswer(questionId: number | undefined, value: number[] | null) {
        if (!questionId) return;
        this.answers = { ...this.answers, [questionId]: Array.isArray(value) ? value : [] };
    }

    otherAnswer(questionId?: number): string {
        if (!questionId) return '';
        return this.otherAnswers[questionId] ?? '';
    }

    setOtherAnswer(questionId: number | undefined, value: string) {
        if (!questionId) return;
        this.otherAnswers = { ...this.otherAnswers, [questionId]: value ?? '' };
    }

    isOtherSelected(pregunta: PreguntaFormulario): boolean {
        const selectedValue = this.getAnswer(pregunta.id);
        if (selectedValue == null || selectedValue == undefined || selectedValue == '') return false;

        const selectedIds = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
        return selectedIds.some((selectedId) => {
            if (typeof selectedId !== 'number') {
                return false;
            }

            const selected = (pregunta.opciones ?? []).find((opt) => opt.id == selectedId);
            return !!selected?.es_otro;
        });
    }

    isRequiredInvalid(pregunta: PreguntaFormulario): boolean {
        if (!pregunta.requerida) return false;

        const value = this.getAnswer(pregunta.id);

        if (Array.isArray(value)) {
            if (value.length == 0) return true;

            if (pregunta.permite_otro && this.isOtherSelected(pregunta)) {
                return this.otherAnswer(pregunta.id).trim().length == 0;
            }

            return false;
        }

        if (typeof value == 'boolean') {
            return value == null || value == undefined;
        }

        const baseInvalid = value == null || value == undefined || `${value}`.trim().length == 0;
        if (baseInvalid) return true;

        if (pregunta.permite_otro && this.isOtherSelected(pregunta)) {
            return this.otherAnswer(pregunta.id).trim().length == 0;
        }

        return false;
    }

    normalizeNumber(value: unknown): number | null {
        if (value == null || value == undefined || value == '') return null;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
    }

    isMultipleChoice(pregunta: PreguntaFormulario): boolean {
        const tipoName = this.tiposPreguntaById.get(pregunta.tipo_pregunta_id) ?? '';
        return tipoName.includes('multiple') || tipoName.includes('múltiple') || tipoName.includes('multi');
    }

    getSelectedOptionIds(pregunta: PreguntaFormulario): number[] {
        const value = this.getAnswer(pregunta.id);
        if (Array.isArray(value)) {
            return value.filter((item): item is number => typeof item == 'number');
        }

        return typeof value == 'number' ? [value] : [];
    }

    getQuestionOptionById(pregunta: PreguntaFormulario, optionId: number): QuestionOptionView | null {
        return this.questionOptions(pregunta).find((option) => option.value == optionId) ?? null;
    }

    buildValorTexto(pregunta: PreguntaFormulario): string | null {
        const value = this.getAnswer(pregunta.id);

        if (this.questionOptions(pregunta).length > 0) {
            if (pregunta.permite_otro && this.isOtherSelected(pregunta)) {
                const otro = this.otherAnswer(pregunta.id).trim();
                if (otro) {
                    return otro;
                }
            }

            const selectedLabels = this.getSelectedOptionIds(pregunta)
                .map((optionId) => this.getQuestionOptionById(pregunta, optionId)?.rawValue ?? '')
                .filter((optionValue) => optionValue.trim().length > 0);

            return selectedLabels.length > 0 ? selectedLabels.join(', ') : null;
        }

        if (typeof value == 'boolean') {
            return value ? 'SI' : 'NO';
        }

        if (typeof value == 'number') {
            return String(value);
        }

        if (typeof value == 'string') {
            const normalized = value.trim();
            return normalized.length > 0 ? normalized : null;
        }

        return null;
    }

    getCurrentUserId(): number | null {
        const user = this.authService.getCurrentUser();
        if (!user) {
            return null;
        }

        const candidates = ['id', 'usuario_id', 'user_id'];
        for (const key of candidates) {
            const rawValue = user[key];
            if (typeof rawValue == 'number') {
                return rawValue;
            }

            if (typeof rawValue == 'string' && rawValue.trim() && !Number.isNaN(Number(rawValue))) {
                return Number(rawValue);
            }
        }

        return null;
    }

    toUpperText(value: unknown): string {
        return typeof value == 'string' ? value.toUpperCase() : '';
    }

    onDepartamentoChange(_departamentoId: number | null) {
        this.hogarDraft.municipio_id = null;
        this.hogarDraft.centro_poblado_id = null;
    }

    onMunicipioChange(_municipioId: number | null) {
        this.hogarDraft.centro_poblado_id = null;
    }

    isHogarInvalid(): boolean {
        return (
            !this.hogarDraft.departamento_id ||
            !this.hogarDraft.municipio_id ||
            !this.hogarDraft.nombre_persona.trim() ||
            !this.hogarDraft.cedula.trim() ||
            !this.hogarDraft.direccion.trim()
        );
    }

    buildHogarPayload() {
        return {
            departamento_id: this.hogarDraft.departamento_id!,
            municipio_id: this.hogarDraft.municipio_id!,
            centro_poblado_id: this.hogarDraft.centro_poblado_id,
            nombre_persona: this.hogarDraft.nombre_persona.trim(),
            cedula: this.hogarDraft.cedula.trim(),
            direccion: this.hogarDraft.direccion.trim(),
            telefono: this.hogarDraft.telefono.trim() || null,
            estrato: this.hogarDraft.estrato.trim() || null,
            tipo_vivienda: this.hogarDraft.tipo_vivienda,
            edad: this.hogarDraft.edad,
            sexo: this.hogarDraft.sexo,
            ocupacion: this.hogarDraft.ocupacion.trim() || null,
            ingreso: this.hogarDraft.ingreso
        };
    }

    async submitAnswers() {
        this.submitted.set(true);

        const questions = this.secciones().flatMap((s) => this.visibleQuestions(s));
        const hasInvalid = questions.some((q) => this.isRequiredInvalid(q));

        if (hasInvalid) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Completa las preguntas requeridas.', life: 3500 });
            return;
        }

        if (this.crearHogarAlEnviar && this.isHogarInvalid()) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Completa los datos requeridos para crear el hogar.', life: 3500 });
            return;
        }

        const formulario = this.formulario();
        if (!formulario?.id) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el formulario para enviar.', life: 4000 });
            return;
        }

        const encuestadorId = this.getCurrentUserId();
        if (!encuestadorId) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar el encuestador autenticado.', life: 4500 });
            return;
        }

        this.saving.set(true);
        this.encuestaCreadaId.set(null);

        try {
            let hogarId: number | null = null;

            if (this.crearHogarAlEnviar) {
                const hogar = await firstValueFrom(this.hogarService.create(this.buildHogarPayload()));
                hogarId = hogar.id ?? null;
            }

            const encuesta = await firstValueFrom(
                this.encuestaService.createEncuesta({
                    formulario_id: formulario.id,
                    hogar_id: hogarId,
                    encuestador_id: encuestadorId,
                    estado_id: 1
                })
            );

            if (!encuesta.id) {
                throw new Error('La encuesta no devolvió un identificador válido.');
            }

            for (const pregunta of questions.filter((q) => q.id)) {
                const respuesta = await firstValueFrom(
                    this.respuestaService.createRespuesta({
                        encuesta_id: encuesta.id,
                        pregunta_id: pregunta.id!,
                        valor_texto: this.buildValorTexto(pregunta),
                        estado_id: 1
                    })
                );

                const selectedOptionIds = this.getSelectedOptionIds(pregunta);
                if (!respuesta.id || selectedOptionIds.length == 0) {
                    continue;
                }

                for (const opcionId of selectedOptionIds) {
                    await firstValueFrom(
                        this.valorOpcionRespuestaService.createValor({
                            respuesta_id: respuesta.id,
                            opcion_id: opcionId,
                            estado_id: 1
                        })
                    );
                }
            }

            this.encuestaCreadaId.set(encuesta.id);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Respuestas enviadas correctamente. Encuesta #${encuesta.id}.`, life: 4000 });
        } catch (err: any) {
            const detail = err?.error?.message || 'No se pudieron enviar las respuestas.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }

    goBack() {
        void this.router.navigate(['/pages/formularios']);
    }
}
