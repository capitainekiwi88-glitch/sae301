import { Geolocation } from '@capacitor/geolocation'

class Position {
    latitude: number = 0;
    longitude: number = 0;
    private watcherId: string | null = null;

    async getPosition() {
        try {
            const coordinates = await Geolocation.getCurrentPosition({timeout: 30000});
            this.latitude = coordinates.coords.latitude;
            this.longitude = coordinates.coords.longitude;
        } catch (e: any) {
            throw new Error('Error getting location: ' + (e?.message ?? String(e)));
        }
    }

    // Starts a watcher and returns the watcher id (if available).
    // Uses higher-accuracy options to improve update frequency on mobile.
    async setWatcher(callback: (latitude: number, longitude: number) => void): Promise<string | null> {
        if (this.watcherId) {
            await this.clearWatcher();
        }

        const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 } as any;

        this.watcherId = await Geolocation.watchPosition(options, (position, err) => {
            if (err) {
                console.error('Geolocation watch error:', err);
                return;
            }

            if (!position || !position.coords) {
                console.warn('Geolocation watch returned empty position');
                return;
            }

            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;
            try {
                callback(this.latitude, this.longitude);
            } catch (cbErr) {
                console.error('Watcher callback error:', cbErr);
            }
        });

        return this.watcherId ?? null;
    }

    // Clears the watcher (accepts an id or uses the stored one).
    async clearWatcher(id?: string | null) {
        const toClear = id ?? this.watcherId;
        if (!toClear) return;
        try {
            await Geolocation.clearWatch({ id: toClear } as any);
            if (toClear === this.watcherId) this.watcherId = null;
            console.log('Cleared geolocation watcher:', toClear);
        } catch (e) {
            console.error('Error clearing watcher:', e);
        }
    }
}

export default Position;