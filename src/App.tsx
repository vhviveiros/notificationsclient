import { SafeAreaView, StyleSheet, Text } from 'react-native';
import React from 'react';
import { Typography, View } from 'react-native-ui-lib';
import { observer } from 'mobx-react-lite';
import WebSitesMonitor from './components/WebSitesMonitor.tsx';
import MediumButton from './components/MediumButton.tsx';
import useService from './hooks/useServices.ts';
import NotificationsService from './services/NotificationsService.ts';
import { TYPES } from '../tsyringe.types.ts';
import ConnectionService from './services/ConnectionService.ts';
import ForegroundService from './services/ForegroundService.ts';
import WebSiteMonitorService from './services/WebSiteMonitorService.ts';
import useState from './hooks/useStates.ts';
import WebSiteMonitorState from './state/WebSiteMonitorState.ts';

Typography.loadTypographies({
    h1: { fontSize: 58, fontWeight: '300', lineHeight: 80 },
    counter: { fontSize: 58, fontWeight: '300', lineHeight: 80, textAlign: 'center' },
});

export default function App(): JSX.Element {
    return (
        <MainContent />
    );
}

const MainContent: React.FC = observer(() => {
    const urlData = [
        {
            url: 'https://www.example.com',
            status: 'active',
        },
        {
            url: 'https://www.brokenlink.com',
            status: 'inactive',
        },
        {
            url: 'https://www.another-example.org',
            status: 'active',
        },
    ];

    const services = {
        connection: useService<ConnectionService>(TYPES.ConnectionService),
        foreground: useService<ForegroundService>(TYPES.ForegroundService),
        notifications: useService<NotificationsService>(TYPES.NotificationsService),
        webSiteMonitor: useService<WebSiteMonitorService>(TYPES.WebSiteMonitorService),
    };

    const startServices = () => {
        Object.values(services).forEach(service => service.init());
    };

    const webSiteMonitorState = useState<WebSiteMonitorState>(TYPES.WebSiteMonitorState);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Website Monitor</Text>
                <WebSitesMonitor style={styles.sitesMonitor} webSiteMonitorState={webSiteMonitorState} />
                <MediumButton
                    text={'Start Monitoring'}
                    color='#4299e1'
                    style={styles.btn}
                    onPress={startServices}
                />
            </View>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f7fafc',
    },
    container: {
        flex: 1,
        backgroundColor: '#f7fafc',
        padding: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 24,
        textAlign: 'center',
    },
    btn: {
        alignSelf: 'center',
        marginTop: 24,
        width: '80%',
    },
    sitesMonitor: {
        width: '100%',
    },
});
