<script lang="ts">
    import { goto } from "@mateothegreat/svelte5-router";

    export let open: boolean = false;

</script>

<nav class="absolute left-1 top-1 z-20 bg-white p-2 rounded-md flex gap-4">
    <button class="cursor-pointer" on:click={() => open = !open}><i class="fa-solid fa-bars"></i></button>
    <button class="cursor-pointer" on:click={() => goto("/")} ><i class="fa-solid fa-house"></i></button>
</nav>

<aside class:open class="bg-black/50 w-full h-full" on:click={() => open = false}>
    <div class="w-1/4 margin-3 rounded-lg bg-white h-full flex flex-col" on:click|stopPropagation>
        <div>
            <button class="cursor-pointer relative left-1 top-0" on:click={() => open = false}><i class="fa-solid fa-xmark"></i></button>
        </div>
        <button class="cursor-pointer" on:click={() => { goto("/parametres"); open = false; }}><h2>Paramètres</h2></button>
    </div>
</aside>

<style>
    aside {
        transition: opacity 0.5s ease-in-out;
        left: -100%;
        position: absolute;
        z-index: 40;
        opacity: 0;
    }

    .open {
        left: 0;
        opacity: 1;
    }
</style>