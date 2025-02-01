/**
 * Type identifiers for dependency injection using TSyringe.
 * These symbols are used to uniquely identify services and states for container resolution.
 * 
 * @property {Symbol} ConnectionService - Symbol for the WebSocket connection management service
 * @property {Symbol} NotificationsService - Symbol for the notifications and foreground service manager
 * @property {Symbol} ForegroundService - Symbol for the Android foreground service handler
 * @property {Symbol} BatteryState - Symbol for the battery state management service
 * @property {Symbol} WebSiteMonitorService - Symbol for the WebSiteMonitorService
 * @property {Symbol} WebSiteMonitorState - Symbol for the WebSiteMonitorState
 */
export const TYPES = {
    ConnectionService: Symbol.for('ConnectionService'),
    NotificationsService: Symbol.for('NotificationsService'),
    ForegroundService: Symbol.for('ForegroundService'),
    BatteryState: Symbol.for('BatteryState'),
    WebSiteMonitorService: Symbol.for('WebSiteMonitorService'),
    WebSiteMonitorState: Symbol.for('WebSiteMonitorState'),
};
