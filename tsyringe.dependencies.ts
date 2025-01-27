import {container} from 'tsyringe';
import ConnectionService from './src/services/ConnectionService.ts';
import ForegroundService from './src/services/ForegroundService.ts';
import NotificationsService from './src/services/NotificationsService.ts';
import BatteryState from './src/state/BatteryState.ts';
import {TYPES} from './tsyringe.types.ts';

container.registerSingleton(TYPES.BatteryState, BatteryState);
container.registerSingleton(TYPES.ConnectionService, ConnectionService);
container.registerSingleton(TYPES.ForegroundService, ForegroundService);
container.registerSingleton(TYPES.NotificationsService, NotificationsService);

export {container};
