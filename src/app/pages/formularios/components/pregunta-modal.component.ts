import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TipoPregunta } from '@/app/pages/service/formulario.service';
import { OpcionRespuestaModalComponent, OpcionRespuestaModalModel } from './opcion-respuesta-modal.component';

export interface PreguntaModalRegla {
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

export interface PreguntaModalOpcion {
    id?: number;
    tempId: string;
    valor?: string;
    etiqueta: string;
    orden: number;
    activa: boolean;
    es_otro: boolean;
}

export interface PreguntaModalModel {
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
    opciones: PreguntaModalOpcion[];
    reglas: PreguntaModalRegla[];
}

@Component({
    selector: 'app-pregunta-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, CheckboxModule, OpcionRespuestaModalComponent],
    template: `
        <p-dialog
            [visible]="visible"
            [modal]="true"
            [draggable]="false"
            [resizable]="false"
            [style]="{ width: 'min(1000px, 96vw)' }"
            [header]="title"
            (onShow)="onDialogShow()"
            (onHide)="onCancel()"
        >
            @if (localQuestion) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-2 font-semibold">Tipo *</label>
                        <p-select appendTo="body" [options]="tiposPregunta" optionLabel="nombre" optionValue="id" [(ngModel)]="localQuestion.tipo_pregunta_id" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Etiqueta *</label>
                        <input pInputText [(ngModel)]="localQuestion.etiqueta" class="w-full" />
                    </div>
                </div>

                <div class="my-4 flex items-center gap-2">
                    <p-checkbox
                        [(ngModel)]="advancedOptionsEnabled"
                        [binary]="true"
                        [inputId]="'modal-advanced-' + localQuestion.tempId"
                        (ngModelChange)="onAdvancedOptionsChange($event)"
                    ></p-checkbox>
                    <label [for]="'modal-advanced-' + localQuestion.tempId" class="font-semibold">Opciones avanzadas</label>
                </div>

                @if (advancedOptionsEnabled) {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                            <label class="block mb-2 font-semibold">Placeholder</label>
                            <input pInputText [(ngModel)]="localQuestion.placeholder" class="w-full" />
                        </div>
                        <div>
                            <label class="block mb-2 font-semibold">Texto ayuda</label>
                            <input pInputText [(ngModel)]="localQuestion.texto_ayuda" class="w-full" />
                        </div>
                        <div>
                            <label class="block mb-2 font-semibold">Validacion regex</label>
                            <input pInputText [(ngModel)]="localQuestion.validacion_regex" class="w-full" />
                        </div>
                        <div>
                            <label class="block mb-2 font-semibold">Mapeo campo fijo</label>
                            <input pInputText [(ngModel)]="localQuestion.mapeo_campo_fijo" class="w-full" />
                        </div>
                        <div>
                            <label class="block mb-2 font-semibold">Valor minimo</label>
                            <input pInputText type="number" [(ngModel)]="localQuestion.valor_minimo" class="w-full" />
                        </div>
                        <div>
                            <label class="block mb-2 font-semibold">Valor maximo</label>
                            <input pInputText type="number" [(ngModel)]="localQuestion.valor_maximo" class="w-full" />
                        </div>
                    </div>
                }

                <div class="grid grid-cols-2 md:grid-cols-5 gap-3 my-4">
                    <div class="flex items-center gap-2">
                        <p-checkbox [(ngModel)]="localQuestion.requerida" [binary]="true" [inputId]="'modal-req-' + localQuestion.tempId"></p-checkbox>
                        <label [for]="'modal-req-' + localQuestion.tempId">Requerida</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox [(ngModel)]="localQuestion.visible" [binary]="true" [inputId]="'modal-vis-' + localQuestion.tempId"></p-checkbox>
                        <label [for]="'modal-vis-' + localQuestion.tempId">Visible</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox [(ngModel)]="localQuestion.solo_lectura" [binary]="true" [inputId]="'modal-solo-' + localQuestion.tempId"></p-checkbox>
                        <label [for]="'modal-solo-' + localQuestion.tempId">Solo lectura</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox [(ngModel)]="localQuestion.permite_otro" [binary]="true" [inputId]="'modal-otro-' + localQuestion.tempId"></p-checkbox>
                        <label [for]="'modal-otro-' + localQuestion.tempId">Permite otro</label>
                    </div>
                    <div>
                        <input pInputText [(ngModel)]="localQuestion.etiqueta_otro" [disabled]="!localQuestion.permite_otro" placeholder="Etiqueta otro" class="w-full" />
                    </div>
                </div>

                @if (esTipoConOpciones(localQuestion.tipo_pregunta_id)) {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-3 mb-3">
                        <div class="flex items-center justify-between mb-3">
                            <strong>Opciones</strong>
                            <p-button size="small" icon="pi pi-plus" label="Agregar opcion" [outlined]="true" (click)="openCreateOptionModal()"></p-button>
                        </div>
                        @for (opcion of localQuestion.opciones; track opcion.tempId) {
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 items-center">
                                <div class="md:col-span-7">
                                    <span class="text-surface-500 text-xs">Etiqueta</span>
                                    <div class="font-medium">{{ opcion.etiqueta }}</div>
                                </div>
                                <div class="md:col-span-3">
                                    <span class="text-surface-500 text-xs">Estado</span>
                                    <div class="font-medium">{{ opcion.activa ? 'Activa' : 'Inactiva' }} / {{ opcion.es_otro ? 'Otro' : 'Normal' }}</div>
                                </div>
                                <div class="md:col-span-2 flex gap-2 justify-end">
                                    <p-button size="small" icon="pi pi-pencil" [outlined]="true" (click)="openEditOptionModal(opcion.tempId)"></p-button>
                                    <p-button size="small" icon="pi pi-trash" severity="danger" [outlined]="true" (click)="removeOption(opcion.tempId)"></p-button>
                                </div>
                            </div>
                        }
                    </div>
                }

                <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-3">
                        <strong>Reglas de salto/logica</strong>
                        <p-button size="small" icon="pi pi-plus" label="Agregar regla" [outlined]="true" (click)="addRule()"></p-button>
                    </div>
                    @for (regla of localQuestion.reglas; track regla.tempId) {
                        <div class="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
                            <p-select
                                appendTo="body"
                                [options]="preguntasDestinoOpciones"
                                optionLabel="label"
                                optionValue="value"
                                [(ngModel)]="regla.pregunta_destino_temp_id"
                                placeholder="Pregunta destino"
                                class="md:col-span-2"
                            ></p-select>
                            <input pInputText [(ngModel)]="regla.operador" placeholder="Operador" />
                            <input pInputText [(ngModel)]="regla.valor_esperado" placeholder="Valor esperado" />
                            <input pInputText [(ngModel)]="regla.accion" placeholder="Accion" />
                            <p-button size="small" icon="pi pi-trash" severity="danger" [outlined]="true" (click)="removeRule(regla.tempId)"></p-button>
                        </div>
                    }
                </div>
            }

            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" severity="secondary" [outlined]="true" (click)="onCancel()"></p-button>
                    <p-button label="Guardar pregunta" icon="pi pi-check" (click)="onSave()"></p-button>
                </div>
            </ng-template>
        </p-dialog>

        <app-opcion-respuesta-modal
            [visible]="optionModalVisible"
            [title]="optionModalTitle"
            [option]="optionModalValue"
            (close)="closeOptionModal()"
            (save)="saveOptionFromModal($event)"
        ></app-opcion-respuesta-modal>
    `
})
export class PreguntaModalComponent implements OnChanges {
    @Input() visible = false;
    @Input() title = 'Pregunta';
    @Input() question: PreguntaModalModel | null = null;
    @Input() tiposPregunta: TipoPregunta[] = [];
    @Input() preguntasDestinoOpciones: Array<{ label: string; value: string }> = [];

    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<PreguntaModalModel>();

    localQuestion: PreguntaModalModel | null = null;
    private tempCounter = 1;
    advancedOptionsEnabled = false;
    optionModalVisible = false;
    optionModalTitle = 'Nueva opción';
    optionModalValue: OpcionRespuestaModalModel | null = null;
    private optionModalEditingTempId: string | null = null;

    constructor(private cdr: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['question'] || changes['visible']) {
            this.syncLocalQuestion();
        }
    }

    onDialogShow() {
        this.syncLocalQuestion();
    }

    onAdvancedOptionsChange(checked: boolean) {
        if (!checked && this.localQuestion && this.hasAdvancedValues(this.localQuestion)) {
            this.advancedOptionsEnabled = true;
            return;
        }
        this.advancedOptionsEnabled = checked;
    }

    onCancel() {
        this.close.emit();
    }

    onSave() {
        if (!this.localQuestion) return;
        if (!this.localQuestion.etiqueta.trim()) return;
        this.normalizeOrders();
        this.save.emit(this.deepClone(this.localQuestion));
    }

    openCreateOptionModal() {
        this.optionModalEditingTempId = null;
        this.optionModalTitle = 'Nueva opción';
        this.optionModalValue = {
            tempId: this.nextTempId('opt'),
            etiqueta: '',
            orden: 1,
            activa: true,
            es_otro: false
        };
        this.optionModalVisible = true;
    }

    openEditOptionModal(optionTempId: string) {
        if (!this.localQuestion) return;
        const option = this.localQuestion.opciones.find((op) => op.tempId == optionTempId);
        if (!option) return;

        this.optionModalEditingTempId = optionTempId;
        this.optionModalTitle = 'Editar opción';
        this.optionModalValue = this.deepClone(option);
        this.optionModalVisible = true;
    }

    closeOptionModal() {
        this.optionModalVisible = false;
        this.optionModalEditingTempId = null;
        this.optionModalValue = null;
    }

    saveOptionFromModal(option: OpcionRespuestaModalModel) {
        if (!this.localQuestion) return;

        if (this.optionModalEditingTempId) {
            this.localQuestion.opciones = this.localQuestion.opciones.map((op) => (op.tempId == this.optionModalEditingTempId ? { ...op, ...option } : op));
        } else {
            this.localQuestion.opciones.push(option);
        }

        this.normalizeOrders();
        this.closeOptionModal();
    }

    removeOption(tempId: string) {
        if (!this.localQuestion) return;
        this.localQuestion.opciones = this.localQuestion.opciones.filter((o) => o.tempId !== tempId);
        this.normalizeOrders();
    }

    addRule() {
        if (!this.localQuestion) return;
        this.localQuestion.reglas.push({
            tempId: this.nextTempId('reg'),
            operador: '=',
            valor_esperado: '',
            accion: 'mostrar',
            orden: this.localQuestion.reglas.length + 1
        });
    }

    removeRule(tempId: string) {
        if (!this.localQuestion) return;
        this.localQuestion.reglas = this.localQuestion.reglas.filter((r) => r.tempId !== tempId);
        this.normalizeOrders();
    }

    esTipoConOpciones(tipoPreguntaId: number): boolean {
        const tipo = this.tiposPregunta.find((t) => t.id == tipoPreguntaId);
        if (tipo?.requiere_opciones == true) return true;
        const texto = `${tipo?.nombre ?? ''} ${tipo?.codigo ?? ''}`.toLowerCase();
        return texto.includes('select') || texto.includes('opcion') || texto.includes('radio') || texto.includes('check');
    }

    private syncLocalQuestion() {
        this.localQuestion = this.question ? this.deepClone(this.question) : null;
        if (this.localQuestion) {
            this.normalizeOrders();
            this.advancedOptionsEnabled = this.hasAdvancedValues(this.localQuestion);
        } else {
            this.advancedOptionsEnabled = false;
        }

        // PrimeNG dialog can render lazily; trigger a change detection pass after values are copied.
        queueMicrotask(() => this.cdr.detectChanges());
    }

    private normalizeOrders() {
        if (!this.localQuestion) return;
        this.localQuestion.opciones.forEach((op, idx) => (op.orden = idx + 1));
        this.localQuestion.reglas.forEach((rg, idx) => (rg.orden = idx + 1));
    }

    private hasAdvancedValues(question: PreguntaModalModel): boolean {
        return !!(
            question.placeholder?.trim() ||
            question.texto_ayuda?.trim() ||
            question.validacion_regex?.trim() ||
            question.mapeo_campo_fijo?.trim() ||
            question.valor_minimo !== null ||
            question.valor_maximo !== null
        );
    }

    private deepClone<T>(value: T): T {
        return JSON.parse(JSON.stringify(value)) as T;
    }

    private nextTempId(prefix: string): string {
        const id = `${prefix}-${this.tempCounter}`;
        this.tempCounter++;
        return id;
    }
}
