import { writable } from 'svelte/store';

export const routingState = writable({
    isVisible: false,
    destination: '',
    LngLat: { lng: 0, lat: 0 }
});