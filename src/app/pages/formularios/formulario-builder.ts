import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PreguntaModalComponent, PreguntaModalModel } from './components/pregunta-modal.component';
import { ProyectoSelectComponent } from '@/app/shared/components/proyecto-select/proyecto-select.component';
import {
    EstadoFormulario,
    Formulario,
    FormularioService,
    OpcionPregunta,
    PreguntaFormulario,
    ReglaPregunta,
    SeccionFormulario,
    TipoPregunta
} from '@/app/pages/service/formulario.service';

interface BuilderRegla {
    id?: number;
    tempId: string;
    pregunta_origen_id?: number;
    pregunta_destino_id?: number;
    pregunta_destino_temp_id?: string;
    operador: string;
    valor_esperado: string;
    accion: string;
    orden: number;
}

interface BuilderOpcion {
    id?: number;
    tempId: string;
    valor: string;
    etiqueta: string;
    orden: number;
    activa: boolean;
    es_otro: boolean;
}

interface BuilderPregunta {
    id?: number;
    tempId: string;
    tipo_pregunta_id: number;
    codigo: string;
    etiqueta: string;
    texto_ayuda: string | null;
    placeholder: string | null;
    requerida: boolean;
    visible: boolean;
    solo_lectura: boolean;
    orden: number;
    permite_otro: boolean;
    etiqueta_otro: string | null;
    validacion_regex: string | null;
    valor_minimo: number | null;
    valor_maximo: number | null;
    longitud_maxima: number | null;
    mapeo_campo_fijo: string | null;
    opciones: BuilderOpcion[];
    reglas: BuilderRegla[];
}

interface BuilderSeccion {
    id?: number;
    tempId: string;
    titulo: string;
    descripcion: string | null;
    orden: number;
    visible: boolean;
    collapsed: boolean;
    preguntas: BuilderPregunta[];
}

@Component({
    selector: 'app-formulario-builder',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, CheckboxModule, ToastModule, PreguntaModalComponent, ProyectoSelectComponent],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
                <h2 class="m-0 text-2xl font-bold">{{ formulario.id ? 'Editar Formulario' : 'Nuevo Formulario' }}</h2>
                <p class="text-surface-500 dark:text-surface-400 m-0">
                    Construye secciones, preguntas y validaciones en una sola pantalla.
                </p>
            </div>
            <div class="flex gap-2">
                <p-button label="Volver" icon="pi pi-arrow-left" [outlined]="true" (click)="goBack()"></p-button>
                <p-button label="Guardar borrador" icon="pi pi-save" (click)="saveAll(false)" [loading]="saving()"></p-button>
                <p-button
                    label="Guardar y publicar"
                    icon="pi pi-send"
                    severity="success"
                    (click)="saveAll(true)"
                    [loading]="saving()"
                    [disabled]="!puedePublicar()"
                ></p-button>
            </div>
        </div>

        <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 mb-5">
            <h3 class="mt-0 mb-4">Datos del formulario</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block mb-2 font-semibold">Proyecto *</label>
                    <app-proyecto-select [(ngModel)]="formulario.proyecto_id" (ngModelChange)="markDirty()" />
                </div>
                <div>
                    <label class="block mb-2 font-semibold">Estado</label>
                    <p-select
                        appendTo="body"
                        [options]="estadoOptions"
                        optionLabel="label"
                        optionValue="value"
                        [(ngModel)]="formulario.estado"
                        fluid
                        (ngModelChange)="markDirty()"
                    ></p-select>
                </div>
                <div>
                    <label class="block mb-2 font-semibold">Nombre *</label>
                    <input pInputText [(ngModel)]="formulario.nombre" placeholder="Formulario socioeconómico" class="w-full" (ngModelChange)="markDirty()" />
                </div>
                <div>
                    <label class="block mb-2 font-semibold">Código *</label>
                    <input pInputText [(ngModel)]="formulario.codigo" placeholder="FORM-SOC-001" class="w-full" (ngModelChange)="markDirty()" />
                </div>
                <div>
                    <label class="block mb-2 font-semibold">Versión</label>
                    <input pInputText [(ngModel)]="formulario.version" placeholder="1.0" class="w-full" (ngModelChange)="markDirty()" />
                </div>
                <div class="md:col-span-2">
                    <label class="block mb-2 font-semibold">Descripción</label>
                    <textarea pTextarea [(ngModel)]="formulario.descripcion" rows="3" class="w-full" (ngModelChange)="markDirty()"></textarea>
                </div>
                <div class="flex flex-wrap gap-5 md:col-span-2">
                    <div class="flex items-center gap-2">
                        <p-checkbox [(ngModel)]="formulario.usa_firma_encuestado" [binary]="true" inputId="firmaEncuestado" (onChange)="markDirty()"></p-checkbox>
                        <label for="firmaEncuestado">Usa firma encuestado</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox [(ngModel)]="formulario.usa_firma_encuestador" [binary]="true" inputId="firmaEncuestador" (onChange)="markDirty()"></p-checkbox>
                        <label for="firmaEncuestador">Usa firma encuestador</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox [(ngModel)]="formulario.genera_pdf" [binary]="true" inputId="generaPdf" (onChange)="markDirty()"></p-checkbox>
                        <label for="generaPdf">Genera PDF</label>
                    </div>
                </div>
            </div>
        </div>

        <div class="mb-4 flex items-center justify-between">
            <h3 class="m-0">Secciones y preguntas</h3>
            <div class="flex gap-2">
                <p-button label="Expandir todo" icon="pi pi-angle-double-down" [outlined]="true" (click)="expandAllSections()"></p-button>
                <p-button label="Contraer todo" icon="pi pi-angle-double-up" [outlined]="true" (click)="collapseAllSections()"></p-button>
                <p-button label="Agregar sección" icon="pi pi-plus" [outlined]="true" (click)="addSection()"></p-button>
            </div>
        </div>

        @for (seccion of secciones; track seccion.tempId) {
            <div
                class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 mb-5"
                draggable="true"
                (dragstart)="onSectionDragStart(seccion.tempId)"
                (dragover)="onDragOver($event)"
                (drop)="onSectionDrop(seccion.tempId)"
            >
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-bars text-surface-400"></i>
                        <strong>Sección {{ seccion.orden }}</strong>
                    </div>
                    <div class="flex gap-2">
                        <p-button
                            size="small"
                            [label]="seccion.collapsed ? 'Expandir' : 'Contraer'"
                            [icon]="seccion.collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
                            [outlined]="true"
                            (click)="toggleSectionCollapse(seccion.tempId)"
                        ></p-button>
                        <p-button size="small" label="Agregar pregunta" icon="pi pi-plus" [outlined]="true" (click)="openCreateQuestionModal(seccion.tempId)"></p-button>
                        <p-button size="small" label="Eliminar sección" icon="pi pi-trash" severity="danger" [outlined]="true" (click)="removeSection(seccion.tempId)"></p-button>
                    </div>
                </div>

                @if (!seccion.collapsed) {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block mb-2 font-semibold">Título *</label>
                            <input pInputText [(ngModel)]="seccion.titulo" class="w-full" (ngModelChange)="markDirty()" />
                        </div>
                        <div class="flex items-center gap-2 pt-8">
                            <p-checkbox [(ngModel)]="seccion.visible" [binary]="true" [inputId]="'secVisible-' + seccion.tempId" (onChange)="markDirty()"></p-checkbox>
                            <label [for]="'secVisible-' + seccion.tempId">Visible</label>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block mb-2 font-semibold">Descripción</label>
                            <textarea pTextarea [(ngModel)]="seccion.descripcion" rows="2" class="w-full" (ngModelChange)="markDirty()"></textarea>
                        </div>
                    </div>

                    @for (pregunta of seccion.preguntas; track pregunta.tempId) {
                        <div
                            class="border border-dashed border-surface-300 dark:border-surface-600 rounded-lg p-4 mb-4 bg-surface-50/70 dark:bg-surface-800/50"
                            draggable="true"
                            (dragstart)="onQuestionDragStart(seccion.tempId, pregunta.tempId)"
                            (dragover)="onDragOver($event)"
                            (drop)="onQuestionDrop(seccion.tempId, pregunta.tempId)"
                        >
                            <div class="flex items-center justify-between gap-3 mb-2">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-arrows-v text-surface-400"></i>
                                    <strong>Pregunta {{ pregunta.orden }}</strong>
                                </div>
                                <div class="flex gap-2">
                                    <p-button size="small" icon="pi pi-pencil" label="Editar" [outlined]="true" (click)="openEditQuestionModal(seccion.tempId, pregunta.tempId)"></p-button>
                                    <p-button size="small" icon="pi pi-trash" label="Eliminar" severity="danger" [outlined]="true" (click)="removeQuestion(seccion.tempId, pregunta.tempId)"></p-button>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                    <span class="text-surface-500">Etiqueta:</span>
                                    <div class="font-medium">{{ pregunta.etiqueta || 'Sin etiqueta' }}</div>
                                </div>
                                <div>
                                    <span class="text-surface-500">Tipo:</span>
                                    <div class="font-medium">{{ tipoPreguntaLabel(pregunta.tipo_pregunta_id) }}</div>
                                </div>
                                <div>
                                    <span class="text-surface-500">Opciones / Reglas:</span>
                                    <div class="font-medium">{{ pregunta.opciones.length }} / {{ pregunta.reglas.length }}</div>
                                </div>
                            </div>
                        </div>
                    }

                    <div
                        class="border border-dashed border-surface-300 dark:border-surface-600 rounded-lg p-3 text-surface-500 text-sm"
                        (dragover)="onDragOver($event)"
                        (drop)="onQuestionDropToSectionEnd(seccion.tempId)"
                    >
                        Arrastra aquí para mover la pregunta al final de esta sección.
                    </div>
                } @else {
                    <div class="text-sm text-surface-500 dark:text-surface-400">
                        Sección contraída. Preguntas: {{ seccion.preguntas.length }}
                    </div>
                }
            </div>
        }

        <app-pregunta-modal
            [visible]="preguntaModalVisible"
            [title]="preguntaModalTitle"
            [question]="preguntaModalQuestion"
            [tiposPregunta]="tiposPregunta"
            [preguntasDestinoOpciones]="preguntasDestinoOptions(preguntaModalQuestion?.tempId ?? '')"
            (close)="closeQuestionModal()"
            (save)="saveQuestionFromModal($event)"
        ></app-pregunta-modal>
    `
})
export class FormularioBuilder implements OnInit, OnDestroy {
    formulario: Partial<Formulario> = {
        proyecto_id: undefined,
        nombre: '',
        codigo: '',
        descripcion: null,
        version: '1.0',
        usa_firma_encuestado: false,
        usa_firma_encuestador: false,
        genera_pdf: false,
        estado: 'borrador'
    };

    secciones: BuilderSeccion[] = [];
    tiposPregunta: TipoPregunta[] = [];

    estadoOptions: { label: string; value: EstadoFormulario }[] = [
        { label: 'Borrador', value: 'borrador' },
        { label: 'Revisión', value: 'revision' },
        { label: 'Publicado', value: 'publicado' },
        { label: 'Archivado', value: 'archivado' }
    ];

    saving = signal(false);

    private currentFormId?: number;
    private autosaveIntervalId?: number;
    private dirty = false;
    private tempCounter = 1;

    private deletedSectionIds: number[] = [];
    private deletedQuestionIds: number[] = [];
    private deletedOptionIds: number[] = [];
    private deletedRuleIds: number[] = [];

    private draggingSectionTempId?: string;
    private draggingQuestion?: { sectionTempId: string; questionTempId: string };

    preguntaModalVisible = false;
    preguntaModalTitle = 'Nueva pregunta';
    preguntaModalQuestion: BuilderPregunta | null = null;
    private preguntaModalSectionTempId: string | null = null;
    private preguntaModalEditingTempId: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private formularioService: FormularioService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.autosaveIntervalId = window.setInterval(() => {
            if (this.dirty) {
                this.persistDraft();
                this.dirty = false;
            }
        }, 3000);

        void this.initializeComponent();
    }

    private async initializeComponent() {
        await this.loadCatalogsAsync();

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            const id = Number(idParam);
            if (!Number.isNaN(id)) {
                this.currentFormId = id;
                await this.loadFormulario(id);
            }
        } else {
            this.loadDraft();
        }
    }

    ngOnDestroy(): void {
        if (this.autosaveIntervalId) {
            window.clearInterval(this.autosaveIntervalId);
        }
    }

    markDirty() {
        this.dirty = true;
    }

    puedePublicar(): boolean {
        const hasSeccion = this.secciones.some((s) => s.titulo.trim().length > 0);
        const hasPregunta = this.secciones.some((s) => s.preguntas.some((p) => p.etiqueta.trim().length > 0));
        return hasSeccion && hasPregunta;
    }

    goBack() {
        void this.router.navigate(['/pages/formularios']);
    }

    private async loadCatalogsAsync() {
        try {
            this.tiposPregunta = await firstValueFrom(this.formularioService.getTiposPregunta());
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'No se pudieron cargar los catálogos.', life: 4000 });
        }
    }

    private async loadFormulario(id: number) {
        try {
            const detalle = await firstValueFrom(this.formularioService.getFormularioById(id));

            // Cargar metadatos del formulario
            this.formulario = {
                id: detalle.id,
                proyecto_id: detalle.proyecto_id,
                nombre: detalle.nombre || '',
                codigo: detalle.codigo || '',
                descripcion: detalle.descripcion ?? null,
                version: detalle.version ?? '1.0',
                usa_firma_encuestado: detalle.usa_firma_encuestado ?? false,
                usa_firma_encuestador: detalle.usa_firma_encuestador ?? false,
                genera_pdf: detalle.genera_pdf ?? false,
                estado: detalle.estado ?? 'borrador'
            };

            // Obtener secciones del formulario
            const anyDetalle = detalle as Formulario & { secciones_formulario?: SeccionFormulario[] };
            let seccionesRaw = (anyDetalle.secciones ?? anyDetalle.secciones_formulario ?? []) as SeccionFormulario[];

            // Si no hay secciones en la respuesta, mantener array vacío
            this.secciones = seccionesRaw
                .sort((a, b) => a.orden - b.orden)
                .map((sec) => this.toBuilderSection(sec));

            this.updateAllOrders();
            this.clearDraft();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el formulario.', life: 4000 });
        }
    }

    addSection() {
        this.secciones.push({
            tempId: this.nextTempId('sec'),
            titulo: '',
            descripcion: null,
            orden: this.secciones.length + 1,
            visible: true,
            collapsed: false,
            preguntas: []
        });
        this.markDirty();
    }

    toggleSectionCollapse(sectionTempId: string) {
        const section = this.secciones.find((s) => s.tempId == sectionTempId);
        if (!section) return;
        section.collapsed = !section.collapsed;
    }

    expandAllSections() {
        this.secciones.forEach((section) => (section.collapsed = false));
    }

    collapseAllSections() {
        this.secciones.forEach((section) => (section.collapsed = true));
    }

    removeSection(sectionTempId: string) {
        const target = this.secciones.find((s) => s.tempId == sectionTempId);
        if (!target) return;

        if (target.id) this.deletedSectionIds.push(target.id);
        for (const pregunta of target.preguntas) {
            if (pregunta.id) this.deletedQuestionIds.push(pregunta.id);
            for (const opcion of pregunta.opciones) {
                if (opcion.id) this.deletedOptionIds.push(opcion.id);
            }
            for (const regla of pregunta.reglas) {
                if (regla.id) this.deletedRuleIds.push(regla.id);
            }
        }

        this.secciones = this.secciones.filter((s) => s.tempId !== sectionTempId);
        this.updateAllOrders();
        this.markDirty();
    }

    addQuestion(sectionTempId: string) {
        this.openCreateQuestionModal(sectionTempId);
    }

    openCreateQuestionModal(sectionTempId: string) {
        this.preguntaModalSectionTempId = sectionTempId;
        this.preguntaModalEditingTempId = null;
        this.preguntaModalTitle = 'Nueva pregunta';
        this.preguntaModalQuestion = this.createEmptyQuestion();
        this.preguntaModalVisible = true;
    }

    openEditQuestionModal(sectionTempId: string, questionTempId: string) {
        const question = this.getQuestion(sectionTempId, questionTempId);
        if (!question) return;
        this.preguntaModalSectionTempId = sectionTempId;
        this.preguntaModalEditingTempId = questionTempId;
        this.preguntaModalTitle = 'Editar pregunta';
        this.preguntaModalQuestion = this.deepClone(question);
        this.preguntaModalVisible = true;
    }

    closeQuestionModal() {
        this.preguntaModalVisible = false;
        this.preguntaModalSectionTempId = null;
        this.preguntaModalEditingTempId = null;
        this.preguntaModalQuestion = null;
    }

    saveQuestionFromModal(question: PreguntaModalModel) {
        if (!this.preguntaModalSectionTempId) return;
        const section = this.secciones.find((s) => s.tempId == this.preguntaModalSectionTempId);
        if (!section) return;

        const normalized = {
            ...question,
            etiqueta: question.etiqueta.trim()
        } as BuilderPregunta;

        if (this.preguntaModalEditingTempId) {
            section.preguntas = section.preguntas.map((q) => (q.tempId == this.preguntaModalEditingTempId ? normalized : q));
        } else {
            section.preguntas.push(normalized);
        }

        this.updateAllOrders();
        this.markDirty();
        this.closeQuestionModal();
    }

    removeQuestion(sectionTempId: string, questionTempId: string) {
        const section = this.secciones.find((s) => s.tempId == sectionTempId);
        if (!section) return;
        const target = section.preguntas.find((p) => p.tempId == questionTempId);
        if (!target) return;

        if (target.id) this.deletedQuestionIds.push(target.id);
        for (const opcion of target.opciones) {
            if (opcion.id) this.deletedOptionIds.push(opcion.id);
        }
        for (const regla of target.reglas) {
            if (regla.id) this.deletedRuleIds.push(regla.id);
        }

        section.preguntas = section.preguntas.filter((p) => p.tempId !== questionTempId);
        this.updateAllOrders();
        this.markDirty();
    }

    addOption(sectionTempId: string, questionTempId: string) {
        const question = this.getQuestion(sectionTempId, questionTempId);
        if (!question) return;
        question.opciones.push({
            tempId: this.nextTempId('opt'),
            valor: '',
            etiqueta: '',
            orden: question.opciones.length + 1,
            activa: true,
            es_otro: false
        });
        this.markDirty();
    }

    removeOption(sectionTempId: string, questionTempId: string, optionTempId: string) {
        const question = this.getQuestion(sectionTempId, questionTempId);
        if (!question) return;
        const target = question.opciones.find((o) => o.tempId == optionTempId);
        if (target?.id) this.deletedOptionIds.push(target.id);
        question.opciones = question.opciones.filter((o) => o.tempId !== optionTempId);
        question.opciones.forEach((o, i) => (o.orden = i + 1));
        this.markDirty();
    }

    addRule(sectionTempId: string, questionTempId: string) {
        const question = this.getQuestion(sectionTempId, questionTempId);
        if (!question) return;
        question.reglas.push({
            tempId: this.nextTempId('reg'),
            operador: '=',
            valor_esperado: '',
            accion: 'mostrar',
            orden: question.reglas.length + 1
        });
        this.markDirty();
    }

    removeRule(sectionTempId: string, questionTempId: string, ruleTempId: string) {
        const question = this.getQuestion(sectionTempId, questionTempId);
        if (!question) return;
        const target = question.reglas.find((r) => r.tempId == ruleTempId);
        if (target?.id) this.deletedRuleIds.push(target.id);
        question.reglas = question.reglas.filter((r) => r.tempId !== ruleTempId);
        question.reglas.forEach((r, i) => (r.orden = i + 1));
        this.markDirty();
    }

    preguntasDestinoOptions(origenPreguntaTempId: string): Array<{ label: string; value: string }> {
        const result: Array<{ label: string; value: string }> = [];
        for (const sec of this.secciones) {
            for (const pre of sec.preguntas) {
                if (pre.tempId == origenPreguntaTempId) continue;
                result.push({
                    label: `${sec.titulo || 'Sección'} / ${pre.codigo || pre.etiqueta || 'Pregunta'}`,
                    value: pre.tempId
                });
            }
        }
        return result;
    }

    esTipoConOpciones(tipoPreguntaId: number): boolean {
        const tipo = this.tiposPregunta.find((t) => t.id == tipoPreguntaId);
        if (tipo?.requiere_opciones == true) return true;

        const texto = `${tipo?.nombre ?? ''} ${tipo?.codigo ?? ''}`.toLowerCase();
        return texto.includes('select') || texto.includes('opcion') || texto.includes('radio') || texto.includes('check');
    }

    tipoPreguntaLabel(tipoPreguntaId: number): string {
        const tipo = this.tiposPregunta.find((t) => t.id == tipoPreguntaId);
        return tipo?.nombre || `Tipo ${tipoPreguntaId}`;
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onSectionDragStart(sectionTempId: string) {
        this.draggingSectionTempId = sectionTempId;
    }

    onSectionDrop(targetSectionTempId: string) {
        if (!this.draggingSectionTempId || this.draggingSectionTempId == targetSectionTempId) return;

        const fromIndex = this.secciones.findIndex((s) => s.tempId == this.draggingSectionTempId);
        const toIndex = this.secciones.findIndex((s) => s.tempId == targetSectionTempId);
        if (fromIndex < 0 || toIndex < 0) return;

        const [moved] = this.secciones.splice(fromIndex, 1);
        this.secciones.splice(toIndex, 0, moved);
        this.draggingSectionTempId = undefined;
        this.updateAllOrders();
        this.markDirty();
    }

    onQuestionDragStart(sectionTempId: string, questionTempId: string) {
        this.draggingQuestion = { sectionTempId, questionTempId };
    }

    onQuestionDrop(targetSectionTempId: string, targetQuestionTempId: string) {
        if (!this.draggingQuestion) return;

        const sourceSection = this.secciones.find((s) => s.tempId == this.draggingQuestion!.sectionTempId);
        const targetSection = this.secciones.find((s) => s.tempId == targetSectionTempId);
        if (!sourceSection || !targetSection) return;

        const sourceIndex = sourceSection.preguntas.findIndex((p) => p.tempId == this.draggingQuestion!.questionTempId);
        if (sourceIndex < 0) return;

        const [movedQuestion] = sourceSection.preguntas.splice(sourceIndex, 1);
        const targetIndex = targetSection.preguntas.findIndex((p) => p.tempId == targetQuestionTempId);
        targetSection.preguntas.splice(Math.max(targetIndex, 0), 0, movedQuestion);

        this.draggingQuestion = undefined;
        this.updateAllOrders();
        this.markDirty();
    }

    onQuestionDropToSectionEnd(targetSectionTempId: string) {
        if (!this.draggingQuestion) return;

        const sourceSection = this.secciones.find((s) => s.tempId == this.draggingQuestion!.sectionTempId);
        const targetSection = this.secciones.find((s) => s.tempId == targetSectionTempId);
        if (!sourceSection || !targetSection) return;

        const sourceIndex = sourceSection.preguntas.findIndex((p) => p.tempId == this.draggingQuestion!.questionTempId);
        if (sourceIndex < 0) return;

        const [movedQuestion] = sourceSection.preguntas.splice(sourceIndex, 1);
        targetSection.preguntas.push(movedQuestion);

        this.draggingQuestion = undefined;
        this.updateAllOrders();
        this.markDirty();
    }

    async saveAll(publicar: boolean) {
        if (!this.formulario.proyecto_id || !this.formulario.nombre?.trim() || !this.formulario.codigo?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Proyecto, nombre y código son obligatorios.', life: 4000 });
            return;
        }

        this.saving.set(true);

        try {
            const formularioPayload: Partial<Formulario> = {
                proyecto_id: this.formulario.proyecto_id,
                nombre: this.formulario.nombre.trim(),
                codigo: this.formulario.codigo.trim(),
                descripcion: this.formulario.descripcion ?? null,
                version: this.formulario.version || '1.0',
                usa_firma_encuestado: !!this.formulario.usa_firma_encuestado,
                usa_firma_encuestador: !!this.formulario.usa_firma_encuestador,
                genera_pdf: !!this.formulario.genera_pdf,
                estado: publicar ? 'publicado' : this.formulario.estado ?? 'borrador'
            };

            let formularioId = this.formulario.id;
            if (formularioId) {
                await firstValueFrom(this.formularioService.updateFormulario(formularioId, formularioPayload));
            } else {
                const created = await firstValueFrom(this.formularioService.createFormulario(formularioPayload));
                formularioId = created.id;
                this.formulario.id = formularioId;
                this.currentFormId = formularioId;
            }

            if (!formularioId) throw new Error('No se obtuvo formulario_id.');

            await this.executeDeletions();

            const seccionIdByTemp = new Map<string, number>();
            for (const [idx, seccion] of this.secciones.entries()) {
                const payload: Partial<SeccionFormulario> = {
                    formulario_id: formularioId,
                    titulo: seccion.titulo.trim(),
                    descripcion: seccion.descripcion ?? null,
                    orden: idx + 1,
                    visible: seccion.visible
                };

                if (seccion.id) {
                    const updated = await firstValueFrom(this.formularioService.updateSeccion(seccion.id, payload));
                    seccion.id = updated.id ?? seccion.id;
                } else {
                    const created = await firstValueFrom(this.formularioService.createSeccion(payload));
                    seccion.id = created.id;
                }

                if (!seccion.id) throw new Error('No se obtuvo seccion_id.');
                seccionIdByTemp.set(seccion.tempId, seccion.id);
            }

            const preguntaIdByTemp = new Map<string, number>();
            for (const seccion of this.secciones) {
                const seccionId = seccionIdByTemp.get(seccion.tempId);
                if (!seccionId) continue;

                for (const [idx, pregunta] of seccion.preguntas.entries()) {
                    const codigoPregunta = pregunta.codigo?.trim() || `S${seccion.orden}P${idx + 1}`;
                    const payload: Partial<PreguntaFormulario> = {
                        seccion_id: seccionId,
                        tipo_pregunta_id: pregunta.tipo_pregunta_id,
                        codigo: codigoPregunta,
                        etiqueta: pregunta.etiqueta.trim(),
                        texto_ayuda: pregunta.texto_ayuda,
                        placeholder: pregunta.placeholder,
                        requerida: pregunta.requerida,
                        visible: pregunta.visible,
                        solo_lectura: pregunta.solo_lectura,
                        orden: idx + 1,
                        permite_otro: pregunta.permite_otro,
                        etiqueta_otro: pregunta.etiqueta_otro,
                        validacion_regex: pregunta.validacion_regex,
                        valor_minimo: pregunta.valor_minimo,
                        valor_maximo: pregunta.valor_maximo,
                        longitud_maxima: pregunta.longitud_maxima,
                        mapeo_campo_fijo: pregunta.mapeo_campo_fijo
                    };

                    if (pregunta.id) {
                        const updated = await firstValueFrom(this.formularioService.updatePregunta(pregunta.id, payload));
                        pregunta.id = updated.id ?? pregunta.id;
                        pregunta.codigo = codigoPregunta;
                    } else {
                        const created = await firstValueFrom(this.formularioService.createPregunta(payload));
                        pregunta.id = created.id;
                        pregunta.codigo = codigoPregunta;
                    }

                    if (!pregunta.id) throw new Error('No se obtuvo pregunta_id.');
                    preguntaIdByTemp.set(pregunta.tempId, pregunta.id);
                }
            }

            for (const seccion of this.secciones) {
                for (const pregunta of seccion.preguntas) {
                    const preguntaId = preguntaIdByTemp.get(pregunta.tempId);
                    if (!preguntaId) continue;

                    for (const [idx, opcion] of pregunta.opciones.entries()) {
                        const payload: Partial<OpcionPregunta> = {
                            pregunta_id: preguntaId,
                            etiqueta: opcion.etiqueta,
                            orden: idx + 1,
                            activa: opcion.activa,
                            es_otro: opcion.es_otro
                        };

                        if (opcion.id) {
                            const updated = await firstValueFrom(this.formularioService.updateOpcion(opcion.id, payload));
                            opcion.id = updated.id ?? opcion.id;
                        } else {
                            const created = await firstValueFrom(this.formularioService.createOpcion(payload));
                            opcion.id = created.id;
                        }
                    }
                }
            }

            for (const seccion of this.secciones) {
                for (const pregunta of seccion.preguntas) {
                    const origenId = preguntaIdByTemp.get(pregunta.tempId);
                    if (!origenId) continue;

                    for (const [idx, regla] of pregunta.reglas.entries()) {
                        const destinoId = regla.pregunta_destino_temp_id ? preguntaIdByTemp.get(regla.pregunta_destino_temp_id) : regla.pregunta_destino_id;
                        if (!destinoId) continue;

                        const payload: Partial<ReglaPregunta> = {
                            pregunta_origen_id: origenId,
                            pregunta_destino_id: destinoId,
                            operador: regla.operador,
                            valor_esperado: regla.valor_esperado,
                            accion: regla.accion,
                            orden: idx + 1
                        };

                        if (regla.id) {
                            const updated = await firstValueFrom(this.formularioService.updateRegla(regla.id, payload));
                            regla.id = updated.id ?? regla.id;
                        } else {
                            const created = await firstValueFrom(this.formularioService.createRegla(payload));
                            regla.id = created.id;
                        }
                    }
                }
            }

            this.deletedSectionIds = [];
            this.deletedQuestionIds = [];
            this.deletedOptionIds = [];
            this.deletedRuleIds = [];

            this.formulario.estado = publicar ? 'publicado' : this.formulario.estado ?? 'borrador';
            this.clearDraft();
            this.markDirty();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: publicar ? 'Formulario publicado.' : 'Formulario guardado.', life: 3500 });
        } catch (error: unknown) {
            const message = this.extractErrorMessage(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 });
        } finally {
            this.saving.set(false);
        }
    }

    private async executeDeletions() {
        for (const id of this.deletedRuleIds) {
            try {
                await firstValueFrom(this.formularioService.deleteRegla(id));
            } catch {
                // Ignorar para no bloquear el guardado principal.
            }
        }
        for (const id of this.deletedOptionIds) {
            try {
                await firstValueFrom(this.formularioService.deleteOpcion(id));
            } catch {
                // Ignorar para no bloquear el guardado principal.
            }
        }
        for (const id of this.deletedQuestionIds) {
            try {
                await firstValueFrom(this.formularioService.deletePregunta(id));
            } catch {
                // Ignorar para no bloquear el guardado principal.
            }
        }
        for (const id of this.deletedSectionIds) {
            try {
                await firstValueFrom(this.formularioService.deleteSeccion(id));
            } catch {
                // Ignorar para no bloquear el guardado principal.
            }
        }
    }

    private toBuilderSection(section: SeccionFormulario): BuilderSeccion {
        const preguntasRaw = (section.preguntas ?? []) as PreguntaFormulario[];
        const builderSection: BuilderSeccion = {
            id: section.id,
            tempId: this.nextTempId('sec'),
            titulo: section.titulo,
            descripcion: section.descripcion ?? null,
            orden: section.orden,
            visible: section.visible,
            collapsed: false,
            preguntas: preguntasRaw
                .sort((a, b) => a.orden - b.orden)
                .map((pregunta) => {
                    const anyPregunta = pregunta as PreguntaFormulario & { reglas_origen?: ReglaPregunta[] };
                    const reglasRaw = (anyPregunta.reglas ?? anyPregunta.reglas_origen ?? []) as ReglaPregunta[];

                    return {
                        id: pregunta.id,
                        tempId: this.nextTempId('pre'),
                        tipo_pregunta_id: pregunta.tipo_pregunta_id,
                        codigo: pregunta.codigo,
                        etiqueta: pregunta.etiqueta,
                        texto_ayuda: pregunta.texto_ayuda ?? null,
                        placeholder: pregunta.placeholder ?? null,
                        requerida: pregunta.requerida,
                        visible: pregunta.visible,
                        solo_lectura: pregunta.solo_lectura,
                        orden: pregunta.orden,
                        permite_otro: pregunta.permite_otro,
                        etiqueta_otro: pregunta.etiqueta_otro ?? null,
                        validacion_regex: pregunta.validacion_regex ?? null,
                        valor_minimo: pregunta.valor_minimo ?? null,
                        valor_maximo: pregunta.valor_maximo ?? null,
                        longitud_maxima: pregunta.longitud_maxima ?? null,
                        mapeo_campo_fijo: pregunta.mapeo_campo_fijo ?? null,
                        opciones: (pregunta.opciones ?? []).map((op, idx) => ({
                            id: op.id,
                            tempId: this.nextTempId('opt'),
                            valor: op.valor,
                            etiqueta: op.etiqueta,
                            orden: op.orden || idx + 1,
                            activa: op.activa,
                            es_otro: op.es_otro
                        })),
                        reglas: reglasRaw.map((reg, idx) => ({
                            id: reg.id,
                            tempId: this.nextTempId('reg'),
                            pregunta_origen_id: reg.pregunta_origen_id,
                            pregunta_destino_id: reg.pregunta_destino_id,
                            operador: reg.operador,
                            valor_esperado: reg.valor_esperado,
                            accion: reg.accion,
                            orden: reg.orden || idx + 1
                        }))
                    } as BuilderPregunta;
                })
        };

        return builderSection;
    }

    private updateAllOrders() {
        this.secciones.forEach((sec, secIdx) => {
            sec.orden = secIdx + 1;
            sec.preguntas.forEach((pre, preIdx) => {
                pre.orden = preIdx + 1;
                pre.opciones.forEach((op, opIdx) => (op.orden = opIdx + 1));
                pre.reglas.forEach((rg, rgIdx) => (rg.orden = rgIdx + 1));
            });
        });
    }

    private getQuestion(sectionTempId: string, questionTempId: string): BuilderPregunta | undefined {
        const section = this.secciones.find((s) => s.tempId == sectionTempId);
        if (!section) return undefined;
        return section.preguntas.find((p) => p.tempId == questionTempId);
    }

    private createEmptyQuestion(): BuilderPregunta {
        return {
            tempId: this.nextTempId('pre'),
            tipo_pregunta_id: this.tiposPregunta[0]?.id ?? 1,
            codigo: '',
            etiqueta: '',
            texto_ayuda: null,
            placeholder: null,
            requerida: false,
            visible: true,
            solo_lectura: false,
            orden: 1,
            permite_otro: false,
            etiqueta_otro: null,
            validacion_regex: null,
            valor_minimo: null,
            valor_maximo: null,
            longitud_maxima: null,
            mapeo_campo_fijo: null,
            opciones: [],
            reglas: []
        };
    }

    private deepClone<T>(value: T): T {
        return JSON.parse(JSON.stringify(value)) as T;
    }

    private nextTempId(prefix: string): string {
        const id = `${prefix}-${this.tempCounter}`;
        this.tempCounter++;
        return id;
    }

    private get draftStorageKey(): string {
        return this.currentFormId ? `form-builder-${this.currentFormId}` : 'form-builder-new';
    }

    private persistDraft() {
        const payload = {
            formulario: this.formulario,
            secciones: this.secciones
        };
        localStorage.setItem(this.draftStorageKey, JSON.stringify(payload));
    }

    private loadDraft() {
        const draft = localStorage.getItem(this.draftStorageKey);
        if (!draft) return;

        try {
            const parsed = JSON.parse(draft) as { formulario: Partial<Formulario>; secciones: BuilderSeccion[] };
            if (parsed.formulario) {
                this.formulario = {
                    ...this.formulario,
                    ...parsed.formulario
                };
            }
            if (Array.isArray(parsed.secciones)) {
                this.secciones = parsed.secciones;
                this.updateAllOrders();
            }
        } catch {
            localStorage.removeItem(this.draftStorageKey);
        }
    }

    private clearDraft() {
        localStorage.removeItem(this.draftStorageKey);
    }

    private extractErrorMessage(error: unknown): string {
        const fallback = 'No se pudo guardar el formulario.';
        if (!error) return fallback;

        const anyError = error as { error?: { message?: string }; message?: string };
        return anyError.error?.message ?? anyError.message ?? fallback;
    }
}
