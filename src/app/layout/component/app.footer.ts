import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
    <p>&copy; {{ currentYear }} Todos los derechos reservados</p>
      </div>`,
})
export class AppFooter {
    currentYear: number = new Date().getFullYear();
}
