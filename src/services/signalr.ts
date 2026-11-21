import * as signalR from '@microsoft/signalr';
import { AppNotification } from '../types/reporting';

type NotificationListener = (notification: AppNotification) => void;
type LiveEventListener = (eventType: string, payload: unknown) => void;

class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private notificationListeners: NotificationListener[] = [];
  private liveEventListeners: LiveEventListener[] = [];
  private isConnecting = false;

  public async startConnection(token?: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }
    if (this.isConnecting) return;

    this.isConnecting = true;
    const baseUrl = (import.meta.env.VITE_HUB_URL as string)?.replace(/\/hubs(\/)?$/, '') || 'https://hotelapi-jass.onrender.com';
    const hubUrl = `${baseUrl}/hubs/notifications`;

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => {
            if (token) return token;
            const stored = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            return stored || '';
          },
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.hubConnection.on('ReceiveNotification', (notification: AppNotification) => {
        this.notificationListeners.forEach((fn) => fn(notification));
      });

      this.hubConnection.on('ReceiveLiveEvent', (eventType: string, payload: unknown) => {
        this.liveEventListeners.forEach((fn) => fn(eventType, payload));
      });

      await this.hubConnection.start();
      console.log('HotelOS SignalR Live Hub connected successfully.');
    } catch (err) {
      console.warn('SignalR Hub connection failed (will retry automatically or in polling fallback):', err);
    } finally {
      this.isConnecting = false;
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (e) {
        console.error('Error stopping SignalR connection:', e);
      }
      this.hubConnection = null;
    }
  }

  public onNotification(listener: NotificationListener): () => void {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter((l) => l !== listener);
    };
  }

  public onLiveEvent(listener: LiveEventListener): () => void {
    this.liveEventListeners.push(listener);
    return () => {
      this.liveEventListeners = this.liveEventListeners.filter((l) => l !== listener);
    };
  }

  public async joinProperty(propertyId: number): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinProperty', propertyId);
    }
  }

  public async leaveProperty(propertyId: number): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveProperty', propertyId);
    }
  }
}

export const signalRService = new SignalRService();
