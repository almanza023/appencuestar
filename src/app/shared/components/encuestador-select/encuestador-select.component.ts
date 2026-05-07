import { Component, forwardRef, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { UsuarioService } from '@/app/pages/service/usuario.service';

type Opcion = { label: string; value: number };

@Component({
    selector: 'app-encuestador-select',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EncuestadorSelectComponent),
            multi: true
        }
    ],
    template: `
        <p-select
            appendTo="body"
            [(ngModel)]="selectedOption"
            [options]="opciones()"
            optionLabel="label"
            placeholder="Selecciona un encuestador"
            [filter]="true"
            filterPlaceholder="Buscar encuestador..."
            [showClear]="true"
            [disabled]="isDisabled"
            fluid
        />
    `
})
export class EncuestadorSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
    @Input() encuestadorIdSeleccionado: number | string | null = null;

    opciones = signal<Opcion[]>([]);
    isDisabled = false;

    private _selectedId: number | null = null;
    private onChangeFn: (val: number | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private usuarioService: UsuarioService) {}

    get selectedOption(): Opcion | null {
        return this.opciones().find((o) => o.value == this._selectedId) ?? null;
    }

    set selectedOption(opt: Opcion | null) {
        this._selectedId = opt?.value ?? null;
        this.onChangeFn(this._selectedId);
        this.onTouchedFn();
    }

    ngOnInit() {
        this.usuarioService.getAll().subscribe({
            next: (data) => {
                const encuestadores = data.filter((u) => Number(u.rol_id) === 2);
                this.opciones.set(
                    encuestadores.map((u) => ({
                        label: `${u.nombres} ${u.apellidos}`.trim(),
                        value: Number(u.id)
                    }))
                );

                if (this.encuestadorIdSeleccionado !== null) {
                    this.setSelectedEncuestador(this.encuestadorIdSeleccionado);
                }
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['encuestadorIdSeleccionado']) {
            this.setSelectedEncuestador(this.encuestadorIdSeleccionado);
        }
    }

    private setSelectedEncuestador(encuestadorId: number | string | null): void {
        if (encuestadorId === null || encuestadorId === undefined || encuestadorId === '') {
            this._selectedId = null;
            return;
        }

        const normalizedId = Number(encuestadorId);
        this._selectedId = Number.isFinite(normalizedId) ? normalizedId : null;
    }

    writeValue(val: number | string | null): void {
        if (val === null || val === undefined || val === '') {
            this._selectedId = null;
            return;
        }

        const normalizedId = Number(val);
        this._selectedId = Number.isFinite(normalizedId) ? normalizedId : null;
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
