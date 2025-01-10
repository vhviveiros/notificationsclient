/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import MainService from './src/services/MainService';

if (!__DEV__) {
    console.log = () => {};
    console.warn = () => {};
    // console.error = () => {};
    console.info = () => {};
    console.debug = () => {};
}

global.Buffer = require('buffer').Buffer;

MainService.instance.init();
AppRegistry.registerComponent(appName, () => App);
