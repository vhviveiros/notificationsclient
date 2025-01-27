/**
 * @format
 */
import 'reflect-metadata';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import {container} from './tsyringe.dependencies';
import {TYPES} from './tsyringe.types';

// if (!__DEV__) {
//     console.log = () => {};
//     console.warn = () => {};
//     // console.error = () => {};
//     console.info = () => {};
//     console.debug = () => {};
// }
container.resolve(TYPES.NotificationsService);
AppRegistry.registerComponent(appName, () => App);
