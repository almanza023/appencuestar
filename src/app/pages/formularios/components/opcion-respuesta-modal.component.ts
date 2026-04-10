import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

export interface OpcionRespuestaModalModel {
    id?: number;
    tempId: string;
    valor?: string;
    etiqueta: string;
    orden: number;
    activa: boolean;
    es_otro: boolean;
}

@Component({
    selector: 'app-opcion-respuesta-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, InputTextModule, CheckboxModule, ButtonModule],
    template: `
        <p-dialog
            [visible]="visible"
            [modal]="true"
            [draggable]="false"
            [resizable]="false"
            [style]="{ width: 'min(560px, 95vw)' }"
            [header]="title"
            (onHide)="onCancel()"
        >
            @if (localOption) {
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block mb-2 font-semibold">Etiqueta *</label>
                        <input pInputText [(ngModel)]="localOption.etiqueta" class="w-full" placeholder="Sí" />
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="localOption.activa" [binary]="true" [inputId]="'opt-activa-' + localOption.tempId"></p-checkbox>
                            <label [for]="'opt-activa-' + localOption.tempId">Activa</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="localOption.es_otro" [binary]="true" [inputId]="'opt-otro-' + localOption.tempId"></p-checkbox>
                            <label [for]="'opt-otro-' + localOption.tempId">Es otro</label>
                        </div>
                    </div>
                </div>
            }

            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" severity="secondary" [outlined]="true" (click)="onCancel()"></p-button>
                    <p-button label="Guardar opción" icon="pi pi-check" (click)="onSave()"></p-button>
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class OpcionRespuestaModalComponent implements OnChanges {
    @Input() visible = false;
    @Input() title = 'Opción de respuesta';
    @Input() option: OpcionRespuestaModalModel | null = null;

    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<OpcionRespuestaModalModel>();

    localOption: OpcionRespuestaModalModel | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['option'] || changes['visible']) {
            this.localOption = this.option ? this.deepClone(this.option) : null;
        }
    }

    onCancel() {
        this.close.emit();
    }

    onSave() {
        if (!this.localOption) return;
        if (!this.localOption.etiqueta.trim()) return;

        this.save.emit({
            ...this.localOption,
            etiqueta: this.localOption.etiqueta.trim()
        });
    }

    private deepClone<T>(value: T): T {
        return JSON.parse(JSON.stringify(value)) as T;
    }
}
