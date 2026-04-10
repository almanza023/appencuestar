import { Component, forwardRef, OnInit, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { CatalogoService } from '@/app/pages/service/catalogo.service';

@Component({
    selector: 'app-sexo-select',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SexoSelectComponent),
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
            placeholder="Selecciona sexo"
            [filter]="true"
            filterPlaceholder="Buscar sexo..."
            [showClear]="true"
            [disabled]="isDisabled"
            fluid
        />
    `
})
export class SexoSelectComponent implements ControlValueAccessor, OnInit {
    opciones = signal<{ label: string; value: string }[]>([]);
    selectedValue: string | null = null;
    isDisabled = false;

    private onChangeFn: (val: string | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private catalogoService: CatalogoService) {}

    ngOnInit() {
        this.reloadOptions();
    }

    reloadOptions() {
        this.catalogoService.getByCodigoConDetalles('sexo').subscribe({
            next: (catalogo) => {
                this.opciones.set(
                    (catalogo.detalles ?? []).map((detalle) => ({
                        label: `${detalle.nombre}`,
                        value: detalle.valor
                    }))
                );
            }
        });
    }

    writeValue(val: string | null): void {
        this.selectedValue = val ?? null;
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

    onValueChange(val: string | null) {
        this.onChangeFn(val);
        this.onTouchedFn();
    }
}
