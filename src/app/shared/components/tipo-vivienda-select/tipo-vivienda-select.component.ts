import { Component, forwardRef, OnInit, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { CatalogoService } from '@/app/pages/service/catalogo.service';

type Opcion = { label: string; value: string };

@Component({
    selector: 'app-tipo-vivienda-select',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TipoViviendaSelectComponent),
            multi: true
        }
    ],
    template: `
        <p-select
            appendTo="body"
            [(ngModel)]="selectedOption"
            [options]="opciones()"
            optionLabel="label"
            placeholder="Selecciona tipo de vivienda"
            [filter]="true"
            filterPlaceholder="Buscar tipo de vivienda..."
            [showClear]="true"
            [disabled]="isDisabled"
            fluid
        />
    `
})
export class TipoViviendaSelectComponent implements ControlValueAccessor, OnInit {
    opciones = signal<Opcion[]>([]);
    isDisabled = false;

    private _selectedValue = signal<string | null>(null);
    private onChangeFn: (val: string | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private catalogoService: CatalogoService) {}

    get selectedOption(): Opcion | null {
        return this.opciones().find((option) => option.value == this._selectedValue()) ?? null;
    }

    set selectedOption(option: Opcion | null) {
        this._selectedValue.set(option?.value ?? null);
        this.onChangeFn(this._selectedValue());
        this.onTouchedFn();
    }

    ngOnInit() {
        this.reloadOptions();
    }

    reloadOptions() {
        this.catalogoService.getByCodigoConDetalles('tipo_de_vivienda').subscribe({
            next: (catalogo) => {
                this.opciones.set(
                    (catalogo.detalles ?? []).map((detalle) => ({
                        label: detalle.nombre,
                        value: detalle.valor
                    }))
                );
            }
        });
    }

    setSelectedValue(value: string | null): void {
        this._selectedValue.set(value ?? null);
    }

    writeValue(val: string | null): void {
        this._selectedValue.set(val ?? null);
    }

    registerOnChange(fn: (val: string | null) => void): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouchedFn = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }
}
