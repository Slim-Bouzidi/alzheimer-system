import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client | null = null;
  private readonly topicStreams = new Map<string, Subject<unknown>>();
  private readonly pendingTopics = new Set<string>();
  private readonly activeTopicSubscriptions = new Set<string>();
  private readonly missionUpdates$ = new Subject<unknown>();
  private readonly notifications$ = new Subject<unknown>();
  private readonly dispatchUpdates$ = new Subject<unknown>();
  private connected = false;

  private readonly wsUrl =
    (environment as { supportNetworkWebSocketUrl?: string }).supportNetworkWebSocketUrl ??
    'http://localhost:8082/ws';

  connect(): void {
    if (typeof window === 'undefined') {
      return;
    }
    if (this.client?.active) return;
    try {
      this.client = new Client({
        webSocketFactory: () => new SockJS(this.wsUrl),
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          this.connected = true;
          console.log('📡 WS connected');
          this.activeTopicSubscriptions.clear();
          this.pendingTopics.forEach((topic) => {
            try {
              this.subscribeTopic(topic);
            } catch (err) {
              console.warn('[WS] pending topic subscribe failed (ignored):', topic, err);
            }
          });
        },
        onStompError: () => {
          this.connected = false;
        },
        onWebSocketClose: () => {
          this.connected = false;
        },
      });
      this.client.activate();
    } catch (err) {
      console.warn('[WS] connect failed (ignored):', err);
      this.client = null;
      this.connected = false;
    }
  }

  watchMissions(memberId: number): Observable<unknown> {
    return this.watchTopic(`/topic/missions/${memberId}`);
  }

  watchNotifications(memberId: number): Observable<unknown> {
    return this.watchTopic(`/topic/notifications/${memberId}`);
  }

  watchDispatch(dispatchId: number): Observable<unknown> {
    return this.watchTopic(`/topic/dispatch/${dispatchId}`);
  }

  onMissionUpdate(): Observable<unknown> {
    return this.missionUpdates$.asObservable();
  }

  onNotification(): Observable<unknown> {
    return this.notifications$.asObservable();
  }

  onDispatchUpdate(): Observable<unknown> {
    return this.dispatchUpdates$.asObservable();
  }

  private watchTopic(topic: string): Observable<unknown> {
    this.connect();
    this.pendingTopics.add(topic);
    if (!this.topicStreams.has(topic)) {
      this.topicStreams.set(topic, new Subject<unknown>());
    }
    if (this.connected) {
      this.subscribeTopic(topic);
    }
    return this.topicStreams.get(topic)!.asObservable();
  }

  private subscribeTopic(topic: string): void {
    if (!this.client || !this.connected) return;
    if (this.activeTopicSubscriptions.has(topic)) return;
    try {
      this.activeTopicSubscriptions.add(topic);
      this.client.subscribe(topic, (msg: IMessage) => {
        const stream = this.topicStreams.get(topic);
        if (!stream) return;
        let payload: unknown;
        try {
          payload = JSON.parse(msg.body);
        } catch {
          payload = msg.body;
        }
        console.log('📩 WS message received:', payload);
        try {
          stream.next(payload);
          this.emitGlobalEvent(topic, payload);
        } catch (err) {
          console.warn('[WS] handler error (ignored):', err);
        }
      });
    } catch (err) {
      this.activeTopicSubscriptions.delete(topic);
      console.warn('[WS] subscribe failed (ignored):', topic, err);
    }
  }

  private emitGlobalEvent(topic: string, payload: unknown): void {
    if (topic.startsWith('/topic/missions/')) {
      this.missionUpdates$.next(payload);
      return;
    }
    if (topic.startsWith('/topic/notifications/')) {
      this.notifications$.next(payload);
      return;
    }
    if (topic.startsWith('/topic/dispatch/')) {
      this.dispatchUpdates$.next(payload);
    }
  }
}
