import { Injectable, computed, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private pendingRequests = signal(0);
    private statusMessage = signal('Cargando, realizando peticion...');

    isLoading = computed(() => this.pendingRequests() > 0);
    message = computed(() => this.statusMessage());

    show(message?: string) {
        if (message?.trim()) {
            this.statusMessage.set(message.trim());
        }
        this.pendingRequests.update((value) => value + 1);
    }

    hide() {
        this.pendingRequests.update((value) => (value > 0 ? value - 1 : 0));
    }
}
