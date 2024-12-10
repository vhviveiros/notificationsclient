import {Text} from 'react-native-ui-lib';

class DebugTool {
    private static _instance: DebugTool = new DebugTool();
    private _customView: Text | null = null;
    latestMessage: string = '';

    private constructor() {
    }

    static get instance(): DebugTool {
        return this._instance;
    }

    setCustomView(view: Text) {
        this._customView = view;
    }

    log(message: string) {
        if (this._customView) {
            this._customView.text = message;
        } else {
            console.log(message);
        }
    }
}

export default DebugTool;
