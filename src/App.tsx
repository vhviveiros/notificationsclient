import {SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import React from 'react';
import {View, Button, Text, Typography} from 'react-native-ui-lib';
import {observer} from 'mobx-react';
import {useServerMessage} from './hooks/useConnection.ts';
import {ServicesProvider, useServices} from './components/ServicesContext.tsx';
import NotificationsService from './services/NotificationsService.ts';

Typography.loadTypographies({
    h1: {fontSize: 58, fontWeight: '300', lineHeight: 80},
    counter: {fontSize: 58, fontWeight: '300', lineHeight: 80, textAlign: 'center'},
});

export default function App(): JSX.Element {
    return (
        <ServicesProvider>
            <MainContent/>
        </ServicesProvider>
    );
}

const MainContent: React.FC = observer(() => {
    const {connectionService} = useServices();
    const message = useServerMessage();

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.display}>
                    <ScrollView>
                        <Text h1>{message}</Text>
                    </ScrollView>
                </View>
                <Button
                    style={styles.btn}
                    borderRadius={0}
                    label={'Send Message'}
                    round={false}
                    onPress={() => {
                        connectionService.sendMessage('Hello, World!');
                    }}
                />
                <Button
                    style={styles.btn}
                    borderRadius={0}
                    label={'Notify'}
                    round={false}
                    onPress={() => {
                        NotificationsService.instance.displayPersistentNotification();
                    }}
                />
                <Button
                    style={styles.btn}
                    borderRadius={0}
                    label={'Change State'}
                    round={false}
                    onPress={() => {
                        setTimeout(() => {
                            connectionService.setLatestMessage('{"serviceName":"BatteryService","result":{"status":{"chargingStatus":"meme","batteryLevel":20,"isCharging":true}}}');
                            NotificationsService.instance.displayPersistentNotification();
                        }, 3000);
                    }}
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
