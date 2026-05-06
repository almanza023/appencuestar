import { Component, forwardRef, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { DepartamentoService } from '@/app/pages/service/departamento.service';

type Opcion = { label: string; value: number };

@Component({
    selector: 'app-departamento-select',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DepartamentoSelectComponent),
            multi: true
        }
    ],
    template: `
        <p-select
            appendTo="body"
            [(ngModel)]="selectedOption"
            [options]="opciones()"
            optionLabel="label"
            placeholder="Selecciona un departamento"
            [filter]="true"
            filterPlaceholder="Buscar departamento..."
            [showClear]="true"
            [disabled]="isDisabled"
            fluid
        />
    `
})
export class DepartamentoSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
    /**
     * Departamento que viene desde otro componente/padre
     * para mostrarse seleccionado automáticamente.
     */
    @Input() departamentoIdSeleccionado: number | null = null;

    opciones = signal<Opcion[]>([]);
    isDisabled = false;

    private _selectedId: number | null = null;
    private onChangeFn: (val: number | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private departamentoService: DepartamentoService) {}

    get selectedOption(): Opcion | null {
        return this.opciones().find((o) => o.value == this._selectedId) ?? null;
    }

    set selectedOption(opt: Opcion | null) {
        this._selectedId = opt?.value ?? null;
        this.onChangeFn(this._selectedId);
        this.onTouchedFn();
    }

    ngOnInit() {
        this.departamentoService.getAll().subscribe({
            next: (data) => {
                const activos = data.filter((d) => d.estado_id == null || d.estado_id == 1);

                this.opciones.set(
                    activos.map((d) => ({
                        label: d.nombre,
                        value: Number(d.id)
                    }))
                );

                if (this.departamentoIdSeleccionado !== null) {
                    this.setSelectedDepartamento(this.departamentoIdSeleccionado);
                }
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['departamentoIdSeleccionado']) {
            this.setSelectedDepartamento(this.departamentoIdSeleccionado);
        }
    }

    setSelectedDepartamento(departamentoId: number | null): void {
        if (departamentoId == null || departamentoId == undefined) {
            this._selectedId = null;
            return;
        }

        this._selectedId = Number(departamentoId);
    }

    writeValue(val: number | null): void {
        this._selectedId = val !== null && val !== undefined ? Number(val) : null;
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
}
