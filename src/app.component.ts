import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoadingDialogComponent } from './app/shared/components/loading-dialog/loading-dialog.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, LoadingDialogComponent],
    template: `
        <router-outlet></router-outlet>
        <app-loading-dialog></app-loading-dialog>
    `
})
export class AppComponent {}
