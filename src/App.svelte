<script lang="ts">
  import { Geolocation } from '@capacitor/geolocation'
  import { Router, type RouteConfig } from "@mateothegreat/svelte5-router";
  import "@maptiler/sdk/dist/maptiler-sdk.css";
  import User from './user';
  import Position from './position';
  import Map from './map';
  import { Parking } from './parking';
  import { LngLat } from '@maptiler/sdk';
  import { onMount } from 'svelte';
  import Navbar from './components/Navbar.svelte';
  import Home from './routes/Home.svelte';
  import Params from './routes/Params.svelte';
  import RoutingComponent from './components/Routing.svelte';
  import LoginRegisterForm from './components/LoginRegisterForm.svelte';
  import { get } from 'svelte/store';
  import { routingState } from './stores/routingStore';
  import { mapStore } from './stores/mapStore';
  import { UserContent } from './stores/userStore';

  let errorMessage: string | null = null;
  let hasArrived = false;

  const routes: RouteConfig[] = [
    {
      component: Home,
    },
    {
      path: "parametres",
      component: Params,
      props: {
        UserContent
      }
    }
  ];

  const deviceHeight = window.innerHeight;
  const deviceWidth = window.innerWidth;
  let openSideMenu = false;

  const position: Position = new Position();
  const parking = new Parking();
  onMount(() => {
    mapInit();
  });
  // Clear route when routing component is closed
  $: if (!$routingState.isVisible) {
    const currentMap = get(mapStore);
    if (currentMap) {
      currentMap.clearRoute();
      currentMap.map.easeTo({pitch: 0, bearing:0,zoom:15});
    }
    hasArrived = false;
  }

  // refresh markers when dspOnly changes and map exists
  $: if ($mapStore && $UserContent.dspOnly !== undefined) {
    (async () => {
      try {
        $mapStore.clearParkingMarkers();
        $mapStore.setParkingMarkers(
        parking.getNearParkings(new LngLat(position.longitude, position.latitude), $UserContent.dspOnly)
        );
      } catch (e) {
        console.error('Failed to refresh parkings', e);
      }
    })();
  }

  async function mapInit() {
    console.log('mapInit started');
    let map = get(mapStore);
    errorMessage = null;
    // Ensure permissions are checked/requested before proceeding
  try {
      const permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        if (requestStatus.location !== 'granted') {
          errorMessage = "L'accès à la localisation est nécessaire pour utiliser l'application.";
          return;
        }
      }
    } catch (e) {
      errorMessage = "Erreur lors de la demande de permissions.";
      console.error(e);
      return;
    }

    if (!map) {
      map = new Map('map');
      mapStore.set(map);
      
      try {
        await position.getPosition();
        map.longitude = position.longitude;
        map.latitude = position.latitude;
      } catch (e) {
        console.error('Could not get initial position', e);
        errorMessage = "Impossible de récupérer votre position actuelle.";
        // A supprimer si pas de position par défaut
        position.longitude = 6.17269; 
        position.latitude = 49.11911;
        map.longitude = 6.17269;
        map.latitude = 49.11911;
      }

      map.loadMap();
      position.setWatcher((lat: number, lng: number) => {
        map!.setPosition(lat, lng);
        const currentRoute = get(routingState);
        if(currentRoute.isVisible && currentRoute.LngLat && !hasArrived){
          const userLocation = new LngLat(lng, lat);
          const destinationLocation = new LngLat(currentRoute.LngLat.lng, currentRoute.LngLat.lat);
          const distance = userLocation.distanceTo(destinationLocation);

          if(distance < 40){
            hasArrived = true;
            triggerArrivalAnimation(map,destinationLocation);
            console.log("Vous êtes arrivé à destination !");
          }
        }
      });
      await parking.fetchParkings();
      console.log(parking.parkings.length + ' parkings loaded');
      const largeRadius = 50000; 
      map.setParkingMarkers(parking.getNearParkings(new LngLat(position.longitude, position.latitude), $UserContent.dspOnly, largeRadius, [0,0,0]));
    } else {
      console.log('Using existing Map instance');
      map.loadMap();
      
      // Re-attach watcher
      position.setWatcher((lat: number, lng: number) => {
        map!.setPosition(lat, lng);
        const currentRoute = get(routingState);
        if(currentRoute.isVisible && currentRoute.LngLat && !hasArrived){
          const userLocation = new LngLat(lng, lat);
          const destinationLocation = new LngLat(currentRoute.LngLat.lng, currentRoute.LngLat.lat);
          const distance = userLocation.distanceTo(destinationLocation);

          if(distance < 40){
            hasArrived = true;
            triggerArrivalAnimation(map, destinationLocation);
            console.log("Vous êtes arrivé à destination !");
          }
        }
      });
      
      // Check if we need to fetch
      if (parking.parkings.length === 0) {
         await parking.fetchParkings();
      }
      const largeRadius = 50000; 
      map!.setParkingMarkers(parking.getNearParkings(new LngLat(position.longitude, position.latitude), $UserContent.dspOnly, largeRadius));
    }

      const routeState = get(routingState);
      if (routeState.isVisible && routeState.LngLat) {
        console.log('Redrawing route on existing map');
        map.drawRoute(routeState.LngLat.lng, routeState.LngLat.lat, routeState.destination);
      }
    }
  function triggerArrivalAnimation(mapInstance: any, target: LngLat) {
    if (!mapInstance || !mapInstance.map) return;
    mapInstance.map.flyTo({
        center: target,
        zoom: 18,
        pitch: 60,
        bearing: -45,
        speed: 0.8,
        essential: true
  });
}
</script>

<main class="flex flex-col justify-center items-center" style="height: {deviceHeight}px; width: {deviceWidth}px; ">

  {#if $UserContent.token === ""}

    <LoginRegisterForm UserContent={UserContent} />

  {:else}

    <Navbar bind:open={openSideMenu} />

    {#if $routingState.isVisible}
      <RoutingComponent destination={$routingState.destination} />
    {/if}

    <Router {routes} />

  {/if}
  {#if errorMessage} 
      <div class="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 p-6 text-center"> 
          <div class="bg-red-100 p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">Localisation requise</h2> 
          <p class="text-gray-600 mb-6 max-w-xs">{errorMessage}</p> 
          <button 
            on:click={() => window.location.reload()} 
            class="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg active:scale-95 transition-transform">
            Réessayer
          </button> 
      </div> 
    {/if}
</main>
