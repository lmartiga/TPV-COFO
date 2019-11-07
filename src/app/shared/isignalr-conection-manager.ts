export interface ISignalRConnectionManager {
  createHubProxy(hubName: string): SignalR.Hub.Proxy;
  startConnection(): Promise<any>;
  stopConnection(): void;
}
