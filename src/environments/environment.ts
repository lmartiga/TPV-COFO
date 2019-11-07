// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8091/main',
  apiUrlCofo: 'http://localhost:8091/maincofo',
  httpServerUrl: 'http://localhost:8080',
  signalRUrl: 'http://localhost:8092',
  signalRTMEUrl: 'http://localhost:8093',
  signalRPSSUrl: 'http://localhost:8094',
  // puerto signalR update simulado 8085
  // puerto real signalR update 8086
  signalRUpdateUrl: 'http://localhost:8096',
  signalRMultiTPVUrl: 'http://localhost:8098',
};
