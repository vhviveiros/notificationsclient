/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import PersistentService from './src/services/PersistentService';

global.Buffer = require('buffer').Buffer;

PersistentService.instance.init();
AppRegistry.registerComponent(appName, () => App);
