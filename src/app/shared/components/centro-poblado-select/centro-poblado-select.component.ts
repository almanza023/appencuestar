import { Component, forwardRef, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { CentroPoblado, CentroPobladoService } from '@/app/pages/service/centro-poblado.service';

@Component({
    selector: 'app-centro-poblado-select',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CentroPobladoSelectComponent),
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
            placeholder="Selecciona un centro poblado"
            [filter]="true"
            filterPlaceholder="Buscar centro poblado..."
            [showClear]="true"
            [disabled]="isDisabled"
            fluid
        />
    `
})
export class CentroPobladoSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
    @Input() municipioId: number | null = null;

    opciones = signal<{ label: string; value: number }[]>([]);
    selectedValue: number | null = null;
    isDisabled = false;

    private allCentros: CentroPoblado[] = [];
    private onChangeFn: (val: number | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private centroPobladoService: CentroPobladoService) {}

    ngOnInit() {
        this.centroPobladoService.getAll().subscribe({
            next: (data) => {
                this.allCentros = data.filter((c) => c.estado_id == 1);
                this.filterOpciones();
                if (this.selectedValue !== null) {
                    const current = this.selectedValue;
                    this.selectedValue = null;
                    setTimeout(() => { this.selectedValue = current; });
                }
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['municipioId'] && !changes['municipioId'].firstChange) {
            this.selectedValue = null;
            this.onChangeFn(null);
            this.filterOpciones();
        }
    }

    private filterOpciones() {
        const list = this.municipioId ? this.allCentros.filter((c) => c.municipio_id == this.municipioId) : this.allCentros;
        this.opciones.set(
            list.map((c) => ({
                label: c.nombre,
                value: c.id!
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
