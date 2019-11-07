export interface ISignalRMultiTPVConnectionManager {
    createHubProxy(hubName: string): SignalR.Hub.Proxy;
    startConnection(): Promise<any>;
    stopConnection(): void;
    onInit(ipRemote: string): void;
  }
