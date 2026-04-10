import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LoadingService } from '@/app/core/services/loading.service';

@Component({
    selector: 'app-loading-dialog',
    standalone: true,
    imports: [CommonModule, DialogModule, ProgressSpinnerModule],
    template: `
        <p-dialog
            [visible]="loadingService.isLoading()"
            [modal]="true"
            [closable]="false"
            [draggable]="false"
            [resizable]="false"
            [dismissableMask]="false"
            [showHeader]="false"
            [style]="{ width: '22rem' }"
        >
            <div class="flex flex-col items-center justify-center gap-3 py-4">
                <p-progress-spinner strokeWidth="6" animationDuration="0.8s" [style]="{ width: '64px', height: '64px' }"></p-progress-spinner>
                <div class="text-center font-medium text-surface-700 dark:text-surface-200">
                    {{ loadingService.message() }}
                </div>
            </div>
        </p-dialog>
    `
})
export class LoadingDialogComponent {
    constructor(public loadingService: LoadingService) {}
}
