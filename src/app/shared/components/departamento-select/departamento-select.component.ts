import { Component, forwardRef, OnInit, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { DepartamentoService } from '@/app/pages/service/departamento.service';

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
            [(ngModel)]="selectedValue"
            (ngModelChange)="onValueChange($event)"
            [options]="opciones()"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona un departamento"
            [filter]="true"
            filterPlaceholder="Buscar departamento..."
            [showClear]="true"
            [disabled]="isDisabled"
            fluid
        />
    `
})
export class DepartamentoSelectComponent implements ControlValueAccessor, OnInit {
    opciones = signal<{ label: string; value: number }[]>([]);
    selectedValue: number | null = null;
    isDisabled = false;

    private onChangeFn: (val: number | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private departamentoService: DepartamentoService) {}

    ngOnInit() {
        this.departamentoService.getAll().subscribe({
            next: (data) => {
                const activos = data.filter((d) => d.estado_id === 1);
                this.opciones.set(activos.map((d) => ({ label: d.nombre, value: d.id! })));
            }
        });
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
