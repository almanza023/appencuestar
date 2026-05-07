import { Component, forwardRef, Input, OnChanges, OnInit, signal, SimpleChanges, ChangeDetectorRef } from '@angular/core';
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
    @Input() municipioId: number | string | null = null;
    @Input() centroPobladoId: number | string | null = null;

    opciones = signal<{ label: string; value: number }[]>([]);
    selectedValue: number | null = null;
    isDisabled = false;

    private allCentros: CentroPoblado[] = [];
    private dataLoaded = false;
    private onChangeFn: (val: number | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private centroPobladoService: CentroPobladoService, private cdr: ChangeDetectorRef) {}

    ngOnInit() {
        this.centroPobladoService.getAll().subscribe({
            next: (data) => {
                this.allCentros = data.filter((c) => c.estado_id == 1);
                this.dataLoaded = true;
                this.actualizarOpciones();
                // Después de actualizar opciones, si selectedValue ya tiene un valor
                // (viene de writeValue del ControlValueAccessor), asegurar que esté disponible
                if (this.selectedValue != null) {
                    this.garantizarSeleccion(this.selectedValue);
                }
                // Forzar detección de cambios después de cargar datos
                this.cdr.markForCheck();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        this.municipioId = this.toNumberOrNull(this.municipioId);
        this.centroPobladoId = this.toNumberOrNull(this.centroPobladoId);
        if (!this.dataLoaded) return;

        if (changes['municipioId'] && !changes['municipioId'].firstChange) {
            this.actualizarOpciones();
            // Después de actualizar opciones, garantizar que el valor actual siga siendo válido
            if (this.selectedValue != null) {
                this.garantizarSeleccion(this.selectedValue);
            }
            this.cdr.markForCheck();
        }

        if (changes['centroPobladoId']) {
            if (this.centroPobladoId != null) {
                this.seleccionarCentroPoblado(this.centroPobladoId);
            }
        }
    }

    private seleccionarCentroPoblado(id: number | string) {
        const normalizedId = this.toNumberOrNull(id);
        if (normalizedId == null) {
            this.selectedValue = null;
            return;
        }
        setTimeout(() => {
            this.garantizarSeleccion(normalizedId);
            this.cdr.markForCheck();
        }, 0);
    }

    private garantizarSeleccion(id: number) {
        const existe = this.opciones().some((o) => o.value == id);
        if (existe) {
            this.selectedValue = id;
        } else {
            this.selectedValue = null;
        }
    }

    private actualizarOpciones() {
        const municipioId = this.toNumberOrNull(this.municipioId);
        const list = municipioId ? this.allCentros.filter((c) => Number(c.municipio_id) === municipioId) : this.allCentros;
        this.opciones.set(
            list.map((c) => ({
                label: c.nombre,
                value: Number(c.id)
            }))
        );
    }

    writeValue(val: number | null): void {
        this.selectedValue = this.toNumberOrNull(val);
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
        const normalized = this.toNumberOrNull(val);
        this.selectedValue = normalized;
        this.onChangeFn(normalized);
        this.onTouchedFn();
    }

    private toNumberOrNull(val: unknown): number | null {
        if (val === null || val === undefined || val === '') return null;
        const parsed = Number(val);
        return Number.isFinite(parsed) ? parsed : null;
    }
}
