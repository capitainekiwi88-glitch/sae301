export default class Routing {
    private apiKey: string;
    private baseUrl: string = 'https://graphhopper.com/api/1/route';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getRoute(start: {lat: number, lng: number}, end: {lat: number, lng: number}): Promise<GeoJSON.LineString | null> {
        const query = new URLSearchParams({
            key: this.apiKey,
            profile: 'car',
            points_encoded: 'false',
            locale: 'fr'
        });
        
        // GraphHopper expects point=lat,lon multiple times
        const url = `${this.baseUrl}?${query.toString()}&point=${start.lat},${start.lng}&point=${end.lat},${end.lng}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch route: ${response.statusText}`);
                return null;
            }
            const data = await response.json();
            if (data.paths && data.paths.length > 0) {
                return data.paths[0].points;
            }
        } catch (error) {
            console.error('Error fetching route:', error);
        }
        return null;
    }
}
