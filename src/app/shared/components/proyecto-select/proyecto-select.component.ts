import { Component, forwardRef, OnInit, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { ProyectoService } from '@/app/pages/service/proyecto.service';

@Component({
    selector: 'app-proyecto-select',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ProyectoSelectComponent),
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
            placeholder="Selecciona un proyecto"
            [filter]="true"
            filterPlaceholder="Buscar proyecto..."
            [showClear]="true"
            [disabled]="isDisabled"
            fluid
        />
    `
})
export class ProyectoSelectComponent implements ControlValueAccessor, OnInit {
    opciones = signal<{ label: string; value: number }[]>([]);
    selectedValue: number | null = null;
    isDisabled = false;

    private onChangeFn: (val: number | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private proyectoService: ProyectoService) {}

    ngOnInit() {
        this.proyectoService.getAll().subscribe({
            next: (data) => {
                this.opciones.set(
                    data.map((proyecto) => ({
                        label: proyecto.codigo ? `${proyecto.codigo} - ${proyecto.nombre}` : proyecto.nombre,
                        value: proyecto.id!
                    }))
                );
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
