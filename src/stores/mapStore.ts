import { writable } from 'svelte/store';
import type Map from '../map';

export const mapStore = writable<Map | null>(null);
