import { Component, forwardRef, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { Municipio, MunicipioService } from '@/app/pages/service/municipio.service';

@Component({
    selector: 'app-municipio-select',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MunicipioSelectComponent),
            multi: true
        }
    ],
    template: `
        <p-select
            appendTo="body"
            [(ngModel)]="selectedValue"
            (ngModelChange)="onValueChange($event)"
            [options]="opciones()"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona un municipio"
            [filter]="true"
            filterPlaceholder="Buscar municipio..."
            [showClear]="true"
            [disabled]="isDisabled"
            fluid
        />
    `
})
export class MunicipioSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
    @Input() departamentoId: number | null = null;

    opciones = signal<{ label: string; value: number }[]>([]);
    selectedValue: number | null = null;
    isDisabled = false;

    private allMunicipios: Municipio[] = [];
    private onChangeFn: (val: number | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private municipioService: MunicipioService) {}

    ngOnInit() {
        this.municipioService.getAll().subscribe({
            next: (data) => {
                this.allMunicipios = data.filter((m) => m.estado_id === 1);
                this.filterOpciones();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['departamentoId'] && !changes['departamentoId'].firstChange) {
            this.selectedValue = null;
            this.onChangeFn(null);
            this.filterOpciones();
        }
    }

    private filterOpciones() {
        const list = this.departamentoId
            ? this.allMunicipios.filter((m) => m.departamento_id === this.departamentoId)
            : this.allMunicipios;
        this.opciones.set(
            list.map((m) => ({
                label: m.nombre,
                value: m.id!
            }))
        );
    }

    writeValue(val: number | null): void {
        this.selectedValue = val ?? null;
    }

    registerOnChange(fn: (val: number | null) => void): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouchedFn = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    onValueChange(val: number | null) {
        this.onChangeFn(val);
        this.onTouchedFn();
    }
}
