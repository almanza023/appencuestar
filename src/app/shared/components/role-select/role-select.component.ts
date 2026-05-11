import { Component, forwardRef, OnInit, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { RolService } from '@/app/pages/service/rol.service';

@Component({
    selector: 'app-role-select',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RoleSelectComponent),
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
            placeholder="Selecciona un rol"
            [filter]="true"
            filterPlaceholder="Buscar rol..."
            [showClear]="true"
            [disabled]="isDisabled"
            fluid
        />
    `
})
export class RoleSelectComponent implements ControlValueAccessor, OnInit {
    opciones = signal<{ label: string; value: number }[]>([]);
    selectedValue: number | null = null;
    isDisabled = false;

    private onChangeFn: (val: number | null) => void = () => {};
    private onTouchedFn: () => void = () => {};

    constructor(private rolService: RolService) {}

    ngOnInit() {
        this.rolService.getAll().subscribe({
            next: (data) => {
                const opciones = data.map((rol) => ({ label: rol.nombre, value: rol.id! }));
                const hasAnalista = opciones.some((rol) => rol.value == 3);
                if (!hasAnalista) {
                    opciones.push({ label: 'Analista', value: 3 });
                }
                this.opciones.set(opciones);
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
