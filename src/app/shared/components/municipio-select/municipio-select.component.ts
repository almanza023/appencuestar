import { Component, forwardRef, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { Municipio, MunicipioService } from '@/app/pages/service/municipio.service';

type Opcion = { label: string; value: number };

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
            [(ngModel)]="selectedOption"
            [options]="opciones()"
            optionLabel="label"
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

    /**
     * Municipio que viene desde otro componente/padre
     * para mostrarse seleccionado automáticamente.
     */
    @Input() municipioIdSeleccionado: number | null = null;

    opciones = signal<Opcion[]>([]);
    isDisabled = false;

    private _selectedId: number | null = null;
    private allMunicipios: Municipio[] = [];

    private onChangeFn: (val: number | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private municipioService: MunicipioService) {}

    get selectedOption(): Opcion | null {
        return this.opciones().find((o) => o.value == this._selectedId) ?? null;
    }

    set selectedOption(opt: Opcion | null) {
        this._selectedId = opt?.value ?? null;
        this.onChangeFn(this._selectedId);
        this.onTouchedFn();
    }

    ngOnInit() {
        this.municipioService.getAll().subscribe({
            next: (data) => {
                this.allMunicipios = data.filter((m) => m.estado_id == null || m.estado_id == 1);

                this.filterOpciones();

                if (this.municipioIdSeleccionado !== null) {
                    this.setSelectedMunicipio(this.municipioIdSeleccionado);
                }
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['departamentoId']) {
            this.filterOpciones();

            if (
                !changes['departamentoId'].firstChange &&
                this.departamentoId !== null &&
                this.allMunicipios.length > 0
            ) {
                this.validarMunicipioConDepartamento();
            }
        }

        if (changes['municipioIdSeleccionado']) {
            this.filterOpciones();
            this.setSelectedMunicipio(this.municipioIdSeleccionado);
        }
    }

    private filterOpciones() {
        const departamentoId = this.departamentoId !== null ? Number(this.departamentoId) : null;

        const list =
            departamentoId !== null
                ? this.allMunicipios.filter((m) => Number(m.departamento_id) == departamentoId)
                : this.allMunicipios;

        this.opciones.set(
            list.map((m) => ({
                label: m.nombre,
                value: Number(m.id)
            }))
        );
    }

    setSelectedMunicipio(municipioId: number | null): void {
        if (municipioId == null || municipioId == undefined) {
            this._selectedId = null;
            return;
        }

        this._selectedId = Number(municipioId);
    }

    private validarMunicipioConDepartamento() {
        if (this._selectedId == null || this.departamentoId == null) return;

        const municipioSeleccionado = this.allMunicipios.find(
            (m) => Number(m.id) == Number(this._selectedId)
        );

        if (
            municipioSeleccionado &&
            Number(municipioSeleccionado.departamento_id) !== Number(this.departamentoId)
        ) {
            this._selectedId = null;
            this.onChangeFn(null);
        }
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
