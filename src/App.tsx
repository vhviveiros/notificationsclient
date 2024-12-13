import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import React from 'react';
import { View, Button, Text, Typography } from 'react-native-ui-lib';
import { observer } from 'mobx-react-lite';
import { ServicesProvider } from './components/ServicesContext.tsx';
import useServices from './hooks/useServices.ts';

Typography.loadTypographies({
    h1: { fontSize: 58, fontWeight: '300', lineHeight: 80 },
    counter: { fontSize: 58, fontWeight: '300', lineHeight: 80, textAlign: 'center' },
});

export default function App(): JSX.Element {
    return (
        <ServicesProvider>
            <MainContent />
        </ServicesProvider>
    );
}

const MainContent: React.FC = observer(() => {
    const { connectionService, notificationsService } = useServices();
    const btn1Action = () => {
        connectionService.sendMessage('Hello, Server!');
    };
    const btn2Action = () => {
        notificationsService.displayPersistentNotification();
    };
    const btn3Action = () => {
        setTimeout(() => {
            connectionService.setLatestMessage('{"serviceName":"BatteryService","result":{"status":{"chargingStatus":"meme","batteryLevel":20,"isCharging":true}}}');
            notificationsService.displayPersistentNotification();
        }, 3000);
    };

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.display}>
                    <ScrollView>
                        <Text h1>Empty Here</Text>
                    </ScrollView>
                </View>
                <Button
                    style={styles.btn}
                    borderRadius={0}
                    label={'Send Message'}
                    round={false}
                    onPress={btn1Action}
                />
                <Button
                    style={styles.btn}
                    borderRadius={0}
                    label={'Notify'}
                    round={false}
                    onPress={btn2Action}
                />
                <Button
                    style={styles.btn}
                    borderRadius={0}
                    label={'Change State'}
                    round={false}
                    onPress={btn3Action}
                />
                <Button
                    style={styles.btn}
                    borderRadius={0}
                    label={'Test'}
                    round={false}
                />
            </View>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    display: {
        width: '100%',
        backgroundColor: 'red',
        alignItems: 'center',
        maxHeight: 400,
    },
    container: {
        // flex: 1,
        backgroundColor: '#fff',
        // alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    btn: {
        width: '50%',
        height: '50%',
    },
});
