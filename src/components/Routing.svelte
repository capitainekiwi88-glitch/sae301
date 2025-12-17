<script lang="ts">
    import { routingState } from '../stores/routingStore';
    export let destination;

    function close() {
        routingState.update(state => ({ ...state, isVisible: false }));
    }
</script>

<div class="absolute top-4 left-1/2 -translate-x-1/2 bg-white z-50 flex flex-col items-center justify-center p-4 rounded-lg shadow-lg md:w-1/6 w-3/6 max-w-md">
    <button class="absolute md:right-4 md:top-4 right-1 top-1 cursor-pointer bg-transparent border-none" on:click={close} aria-label="Close">
        <i class="fa-solid fa-xmark md:text-2xl text-lg"></i>
    </button>
    <h1 class="md:text-xl text-lg text-center font-bold mb-4">Navigation vers</h1>
    <h2 class="md:text-lg text-md">{destination ? destination : 'Inconnu'}</h2>
</div>