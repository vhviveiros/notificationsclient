// import {Container} from 'inversify';
// import BatteryState, {BatteryInfo} from './src/state/BatteryState.ts';
// import ConnectionService, {IConnectionService} from './src/services/ConnectionService.ts';
// import ForegroundService, {IForegroundService} from './src/services/ForegroundService.ts';
// import NotificationsService, {INotificationsService} from './src/services/NotificationsService.ts';
// import {TYPES} from './Inversify.types.ts';
//
// const container = new Container({defaultScope: 'Singleton'});
//
// container.bind<BatteryInfo>(TYPES.BatteryState).to(BatteryState).inSingletonScope();
// container.bind<IConnectionService>(TYPES.ConnectionService).to(ConnectionService).inSingletonScope();
// container.bind<IForegroundService>(TYPES.ForegroundService).to(ForegroundService).inSingletonScope();
// // container.bind<INotificationsService>(TYPES.NotificationsService).to(NotificationsService).inSingletonScope();
//
// export default container;
