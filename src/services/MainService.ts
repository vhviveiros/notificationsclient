// import ConnectionService from './ConnectionService.ts';
// import NotificationsService from './NotificationsService.ts';
// import ForegroundService from './ForegroundService.ts';
// import {observe} from 'mobx';
// import Service from './Service.ts';
// import {inject, injectable} from 'inversify';
//
// @injectable()
// export default class MainService extends Service {
//     serviceName: string = 'MainService';
//     services: Service[] = [];
//
//     @inject(ConnectionService)
//     private _connectionService!: ConnectionService;
//
//     @inject(NotificationsService)
//     private _notificationsService!: NotificationsService;
//
//     @inject(ForegroundService)
//     private _foregroundService!: ForegroundService;
//
//     init() {
//         this._initServices();
//     }
//
//     private _initServices() {
//         const _connectionService = this._connectionService;
//         const notificationsService = NotificationsService.instance;
//         const foregroundService = ForegroundService.instance;
//
//         this.services.push(_connectionService, notificationsService, foregroundService);
//         this.services.forEach(service => service.manageDependableServices());
//
//         if (__DEV__) {
//             this.disposerList.push(observe(_connectionService, 'latestMessage', (change) => {
//                 console.log('Received message from persistent:', change.newValue);
//             }));
//         }
//     }
//
//     stop() {
//         this.services.forEach(service => service.stop());
//         super.stop();
//     }
// }
