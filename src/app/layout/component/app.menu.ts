import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/app/core/services/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    constructor(private authService: AuthService) {}

    ngOnInit() {
        const restringido = this.authService.isRolRestringido();

        if (restringido) {
            // Roles restringidos: solo acceden a sus encuestas y su perfil
            this.model = [
                {
                    label: 'Home',
                    items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
                },
                {
                    label: 'Mis Encuestas',
                    items: [
                        { label: 'Encuestas', icon: 'pi pi-fw pi-list-check', routerLink: ['/pages/encuestas'] }
                    ]
                },
                {
                    label: 'Cuenta',
                    items: [
                        { label: 'Mi Perfil', icon: 'pi pi-fw pi-id-card', routerLink: ['/pages/mi-perfil'] }
                    ]
                }
            ];
            return;
        }

        // Acceso completo para roles administrativos
        this.model = [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Gestión',
                items: [
                    { label: 'Proyectos', icon: 'pi pi-fw pi-briefcase', routerLink: ['/pages/proyectos'] },
                    { label: 'Formularios', icon: 'pi pi-fw pi-file-edit', routerLink: ['/pages/formularios'] },
                    { label: 'Hogares', icon: 'pi pi-fw pi-home', routerLink: ['/pages/hogares'] },
                    { label: 'Encuestas', icon: 'pi pi-fw pi-list-check', routerLink: ['/pages/encuestas'] }
                ]
            },
            {
                label: 'Configuración',
                items: [
                    { label: 'Mi Perfil', icon: 'pi pi-fw pi-id-card', routerLink: ['/pages/mi-perfil'] },
                    { label: 'Usuarios', icon: 'pi pi-fw pi-user', routerLink: ['/pages/usuarios'] },
                    { label: 'Catálogos', icon: 'pi pi-fw pi-book', routerLink: ['/pages/catalogos'] },
                    { label: 'Autorización de Datos', icon: 'pi pi-fw pi-shield', routerLink: ['/pages/autorizaciones-datos'] },
                    { label: 'Estados', icon: 'pi pi-fw pi-tags', routerLink: ['/pages/estados'] },
                    { label: 'Roles', icon: 'pi pi-fw pi-users', routerLink: ['/pages/roles'] },
                    { label: 'Departamentos', icon: 'pi pi-fw pi-map', routerLink: ['/pages/departamentos'] },
                    { label: 'Municipios', icon: 'pi pi-fw pi-map-marker', routerLink: ['/pages/municipios'] },
                    { label: 'Centros Poblados', icon: 'pi pi-fw pi-building', routerLink: ['/pages/centros-poblados'] }
                ]
            }
        ];
    }
}
