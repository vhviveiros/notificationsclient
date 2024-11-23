import React, {SafeAreaView, StyleSheet} from 'react-native';
import {View, Button, Text, Typography} from 'react-native-ui-lib';
import {action, observable} from 'mobx';
import {observer} from 'mobx-react';
import {ServerConnection} from './services/ServerConnection.ts';

Typography.loadTypographies({
    h1: {fontSize: 58, fontWeight: '300', lineHeight: 80},
    counter: {fontSize: 58, fontWeight: '300', lineHeight: 80, textAlign: 'center'},
});

export default function App(): JSX.Element {
    const test = new CountTest();
    const connection = ServerConnection.instance;

    const MyComponent = observer(({}) => (
        <View style={styles.container}>
            <View style={styles.display}><Text h1>{test.count}</Text></View>
            <Button
                style={styles.btn}
                borderRadius={0}
                label={'Send Message'}
                round={false}
                onPress={() => {
                    connection.sendMessage('Hello, World!');
                }}
            />
            <Button
                style={styles.btn}
                borderRadius={0}
                label={'Test'}
                round={false}
                onPress={() => {
                    test.increment();
                }}
            />
            <Button
                style={styles.btn}
                borderRadius={0}
                label={'Test'}
                round={false}
                onPress={() => {
                    test.increment();
                }}
            />
            <Button
                style={styles.btn}
                borderRadius={0}
                label={'Test'}
                round={false}
                onPress={() => {
                    test.increment();
                }}
            />
        </View>
    ));

    return (
        <SafeAreaView>
            <MyComponent/>
        </SafeAreaView>
    );
}

class CountTest {
    @observable accessor count: number = 0;

    @action
    increment() {
        this.count++;
        console.log('Incrementing count to ' + this.count);
    }
}

const styles = StyleSheet.create({
    display: {
        width: '100%',
        backgroundColor: 'red',
        alignItems: 'center',
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
