import { LngLat } from "@maptiler/sdk";

export class Parking {
    parkingsDsp : any[] = [];
    parkings : any[] = [];
    private readonly TFL_API_KEY = "06dcde4d1865490d943d578017cd8518"; // Clé récupérer suite à inscription (par Fatih TOPAL)

    private normalizeTflParking(tflData: any[]){
        const normalized = [];
        for(const place of tflData){
            if(place.lat && place.lon){
                normalized.push({id: place.id,
                type: place.type,
                lib: place.commonName,
                place_tot: null, // on a pas cette info et l'APi Occupancy ne fonctionne pas :c
                place_dispo: null,
                cout: null,
                coordinates: {
                    lattitude: place.lat,
                    longitude: place.lon
                },
                city: 'London'
                });
            }
        }
        return normalized;
    }
    getNearParkings(position: LngLat, dspOnly: boolean, radius: number = 3000) {
        let nearbyParkings = [];
        
        const dspParkings = this.parkingsDsp.filter(parking => {
            const parkingPos = new LngLat(parking.coordinates.longitude, parking.coordinates.lattitude);
            const distance = position.distanceTo(parkingPos);
            return distance <= radius;
        });
        nearbyParkings.push(...dspParkings);

        if (!dspOnly) {
            const otherParkings = this.parkings.filter(parking => {
                const parkingPos = new LngLat(parking.coordinates.longitude, parking.coordinates.lattitude);
                const distance = position.distanceTo(parkingPos);
                return distance <= radius;
            });
            nearbyParkings.push(...otherParkings);
        }
        return nearbyParkings;
    }

    getNearestParking(position: LngLat) {
        let nearestParking = null;
        let minDistance = Infinity;

        const allParkings = [...this.parkingsDsp, ...this.parkings]; 

        for (let parking of allParkings) {
            const parkingPos = new LngLat(parking.coordinates.longitude, parking.coordinates.lattitude);
            const distance = position.distanceTo(parkingPos);
            if (distance < minDistance) {
                minDistance = distance;
                nearestParking = parking;
            }
        }

        return nearestParking;
    }

    async fetchParkings() {
        this.parkings = [];
        this.parkingsDsp = [];
        try {
            const metzResponse = await fetch('https://maps.eurometropolemetz.eu/public/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=public:pub_tsp_sta&srsName=EPSG:4326&outputFormat=application%2Fjson&cql_lter=id%20is%20not%20null');
            const metzData = await metzResponse.json();

            for(let feature of metzData.features){
                const parkingData = {id: feature.id,
                    type: feature.properties.typ,
                    lib: feature.properties.lib,
                    place_tot: feature.properties.place_total,
                    place_dispo: feature.properties.place_libre,
                    cout: feature.properties.cout,
                    coordinates: {
                        lattitude: feature.geometry.coordinates[1],
                        longitude: feature.geometry.coordinates[0]
                    },
                    city: 'Metz'
                };
                if(parkingData.place_dispo !== null && parkingData.place_tot !== null){
                    this.parkingsDsp.push(parkingData);
                } else{
                    this.parkings.push(parkingData);
                }
            }
        } catch (e) {
            console.error('Failed to fetch Metz parkings: ', e);
        }

        try {
            const tflUrl = `https://api.tfl.gov.uk/Place/Type/CarPark?app_key=${this.TFL_API_KEY}`;
            const tflResponse = await fetch(tflUrl);

            if(!tflResponse.ok){
                console.error(`TFL Location API request failed with status ${tflResponse.status}`);
                return;
            }
            const tflData = await tflResponse.json();
            const normalizedTflParkings = this.normalizeTflParking(tflData);
            // On les mettra dans parkingsDsp tant que l'API Occupancy ne fonctionne pas
            this.parkingsDsp.push(...normalizedTflParkings) // décomposer et fusionner  (https://www.geeksforgeeks.org/typescript/how-to-use-spread-operator-in-typescript/)
        } catch(e){
            console.error('Failed to fetch TFL parkings: ', e);
        }
    }
}