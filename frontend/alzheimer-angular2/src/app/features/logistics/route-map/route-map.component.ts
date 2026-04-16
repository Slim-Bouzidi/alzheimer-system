import {
    Component, OnInit, OnDestroy, signal, inject, ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { interval, Subscription, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { LocationService, LocationResponseDTO, LocationUpdateDTO } from '../../../services/location.service';
import { RouteService, RouteStatus } from '../../../services/route.service';
import { RouteStopService } from '../../../services/route-stop.service';

// Fix Leaflet default marker icons (Webpack issue)
const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
const iconUrl = 'assets/leaflet/marker-icon.png';
const shadowUrl = 'assets/leaflet/marker-shadow.png';
const defaultIcon = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

export interface StopInfo {
    id: number;
    stopOrder: number;
    status: string;
    patientFullName?: string;
    patientCode?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
}

@Component({
    selector: 'app-route-map',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, BadgeModule, ToastModule],
    providers: [MessageService],
    templateUrl: './route-map.component.html',
    styleUrls: ['./route-map.component.scss']
})
export class RouteMapComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private locationService = inject(LocationService);
    private stopService = inject(RouteStopService);
    private routeService = inject(RouteService);
    private http = inject(HttpClient);
    private messageService = inject(MessageService);
    private cdr = inject(ChangeDetectorRef);

    routeId = 0;
    routeInfo = signal<any>(null);
    stops = signal<StopInfo[]>([]);
    latestLocation = signal<LocationResponseDTO | null>(null);
    loading = signal(true);
    isSimulating = signal(false);

    private map!: L.Map;
    private livreurMarker?: L.Marker;
    private stopMarkers: L.Marker[] = [];
    private pollingSubscription?: Subscription;
    private simulationSubscription?: Subscription;

    // Ariana city center as fixed departure point
    private readonly DEFAULT_LAT = 36.8665;
    private readonly DEFAULT_LNG = 10.1647;

    ngOnInit(): void {
        this.routeId = Number(this.route.snapshot.paramMap.get('routeId'));
        this.loadRouteData();
    }

    ngOnDestroy(): void {
        this.pollingSubscription?.unsubscribe();
        this.simulationSubscription?.unsubscribe();
        this.map?.remove();
    }

    private loadRouteData(): void {
        this.http.get<any>(`/patient-service/api/routes/${this.routeId}`).subscribe({
            next: (r) => {
                this.routeInfo.set(r);
                this.loadStopsAndStart((r.stops || []) as StopInfo[]);
            },
            error: () => {
                this.loadStopsAndStart([]);
            }
        });
    }

    private loadStopsAndStart(fallbackStops: StopInfo[]): void {
        this.stopService.getStops(this.routeId).subscribe({
            next: (stops) => {
                this.stops.set((stops || []) as StopInfo[]);
                this.loading.set(false);
                setTimeout(() => this.initMap(), 200);
                this.startPolling();
            },
            error: () => {
                this.stops.set(fallbackStops);
                this.loading.set(false);
                setTimeout(() => this.initMap(), 200);
                this.startPolling();
            }
        });
    }

    private initMap(): void {
        this.map = L.map('tracking-map').setView([this.DEFAULT_LAT, this.DEFAULT_LNG], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(this.map);

        setTimeout(() => {
            this.map.invalidateSize();
            this.renderStopMarkers();
        }, 100);

        // Ultimate guard: periodically invalidate size during the first 5 seconds
        [500, 1000, 2000, 3000, 5000].forEach(delay => {
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                    console.log(`Map size invalidated at ${delay}ms`);
                }
            }, delay);
        });
    }

    private renderStopMarkers(): void {
        this.stopMarkers.forEach(m => m.remove());
        this.stopMarkers = [];

        const stopsWithCoords = this.stops().filter(s => s.latitude != null && s.longitude != null);

        stopsWithCoords.forEach(stop => {
            const color = stop.status === 'DELIVERED' ? '#22c55e'
                : stop.status === 'CANCELLED' ? '#ef4444' : '#f59e0b';

            const icon = L.divIcon({
                className: '',
                html: `<div style="
          background:${color};color:#fff;border-radius:50%;
          width:32px;height:32px;display:flex;align-items:center;
          justify-content:center;font-weight:bold;font-size:13px;
          border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
          ${stop.stopOrder}
        </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([stop.latitude!, stop.longitude!], { icon })
                .bindPopup(`
          <div style="min-width:140px">
            <strong>#${stop.stopOrder} — ${stop.patientFullName || 'Patient'}</strong><br>
            <small>${stop.patientCode || ''}</small><br>
            <span style="color:${color}">● ${stop.status}</span>
            ${stop.notes ? `<br><em>${stop.notes}</em>` : ''}
          </div>
        `)
                .addTo(this.map);

            this.stopMarkers.push(marker);
        });

        if (stopsWithCoords.length > 0) {
            const group = L.featureGroup(this.stopMarkers);
            this.map.fitBounds(group.getBounds().pad(0.2));
            setTimeout(() => this.map.invalidateSize(), 150);
        }
    }

    private startPolling(): void {
        this.pollingSubscription = interval(5000).pipe(
            switchMap(() => this.locationService.getLatest(this.routeId).pipe(catchError(() => of(null))))
        ).subscribe(loc => {
            console.log('Location update received:', loc);
            if (loc) {
                this.latestLocation.set(loc);
                this.updateLivreurMarker(loc.latitude, loc.longitude);
            }
        });

        // Fetch immediately on start too
        this.locationService.getLatest(this.routeId).pipe(catchError(() => of(null))).subscribe(loc => {
            if (loc) {
                this.latestLocation.set(loc);
                this.updateLivreurMarker(loc.latitude, loc.longitude);
            }
        });
    }

    private updateLivreurMarker(lat: number, lng: number): void {
        if (!this.map) return;

        const icon = L.divIcon({
            className: '',
            html: `<div style="
        background:#6366f1;color:#fff;border-radius:50%;
        width:40px;height:40px;display:flex;align-items:center;
        justify-content:center;font-size:22px;
        border:3px solid white;box-shadow:0 4px 15px rgba(99,102,241,0.6);
        animation: pulse 2s infinite; pointer-events: none;">
        🚚
      </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        if (this.livreurMarker) {
            this.livreurMarker.setLatLng([lat, lng]);
        } else {
            this.livreurMarker = L.marker([lat, lng], {
                icon,
                zIndexOffset: 1000 // Ensure livrer is always on top
            })
                .bindPopup('<strong>🚚 Driver on route</strong><br>Real-time position')
                .addTo(this.map);
        }

        // Force centering if simulating or if it's the first location
        if (this.isSimulating() || this.latestLocation()) {
            this.map.panTo([lat, lng]);
        }
    }

    // ── SIMULATION (mode démo) ──────────────────────────────────────
    toggleSimulation(): void {
        if (this.isSimulating()) {
            this.simulationSubscription?.unsubscribe();
            this.isSimulating.set(false);
            return;
        }

        console.log('Starting simulation for route:', this.routeId);
        this.isSimulating.set(true);

        const stopsWithCoords = [...this.stops()]
            .filter(s => s.latitude != null && s.longitude != null)
            .sort((a, b) => a.stopOrder - b.stopOrder);

        if (stopsWithCoords.length === 0) {
            this.isSimulating.set(false);
            this.messageService.add({
                severity: 'warn',
                summary: 'No GPS stops',
                detail: 'No stop has valid patient coordinates. Please set latitude/longitude for patients first.'
            });
            return;
        }

        const routePoints = [
            { lat: this.DEFAULT_LAT, lng: this.DEFAULT_LNG, stopId: null as number | null },
            ...stopsWithCoords.map(s => ({ lat: s.latitude!, lng: s.longitude!, stopId: s.id }))
        ];

        let step = 0;
        let currentLat = routePoints[0].lat;
        let currentLng = routePoints[0].lng;

        // Place the vehicle at Ariana center as the fixed departure point.
        this.updateLivreurMarker(currentLat, currentLng);

        this.simulationSubscription = interval(1000).subscribe(() => {
            if (routePoints.length === 0) return;

            if (step >= routePoints.length) {
                // Mark the route as DONE in the database
                this.routeService.changeStatus(this.routeId, RouteStatus.DONE).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Route Finished',
                            detail: 'The driver has reached all stops and completed the route.'
                        });
                        this.simulationSubscription?.unsubscribe();
                        this.isSimulating.set(false);
                    },
                    error: (err: any) => console.error('Failed to close route', err)
                });
                return;
            }

            const target = routePoints[step];

            // Calculate direction and distance
            const dLat = target.lat - currentLat;
            const dLng = target.lng - currentLng;
            const distance = Math.sqrt(dLat * dLat + dLng * dLng);
            const speed = 0.002; // Roughly 200m per tick

            if (distance <= speed) {
                // Snap to target exactly
                currentLat = target.lat;
                currentLng = target.lng;

                // Handle delivery update
                if (target.stopId) {
                    const stopToUpdate = this.stops().find(s => s.id === target.stopId);
                    if (stopToUpdate && stopToUpdate.status !== 'DELIVERED') {
                        // Persist to backend
                        this.stopService.markDelivered(stopToUpdate.id).subscribe({
                            next: () => {
                                stopToUpdate.status = 'DELIVERED';
                                this.stops.set([...this.stops()]);
                                this.renderStopMarkers();
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Delivery Successful',
                                    detail: `The driver has reached the point: ${stopToUpdate.patientFullName || 'Patient'}`
                                });
                            },
                            error: (err: any) => console.error('Failed to mark delivered', err)
                        });
                    }
                }
                step++; // Move to next point
            } else {
                // Move towards target at constant speed
                currentLat += (dLat / distance) * speed;
                currentLng += (dLng / distance) * speed;
            }

            const dto: LocationUpdateDTO = {
                staffId: this.routeInfo()?.staffId || 1,
                routeId: this.routeId,
                latitude: currentLat,
                longitude: currentLng
            };

            const localLoc: LocationResponseDTO = {
                id: -1,
                ...dto,
                timestamp: new Date().toISOString()
            };

            this.latestLocation.set(localLoc);
            this.updateLivreurMarker(localLoc.latitude, localLoc.longitude);
            this.cdr.detectChanges(); // Force UI to update

            this.locationService.pushLocation(dto).pipe(catchError((err) => {
                console.error('Simulation POST failed:', err);
                return of(null);
            })).subscribe();
        });
    }

    goBack(): void {
        this.router.navigate(['/routes']);
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'DELIVERED': return 'status-delivered';
            case 'CANCELLED': return 'status-cancelled';
            default: return 'status-pending';
        }
    }

    formatTime(ts: string | null | undefined): string {
        if (!ts) return '—';
        return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}
