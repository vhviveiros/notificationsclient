import {SafeAreaView, StyleSheet} from 'react-native';
import React from 'react';
import {Typography, View} from 'react-native-ui-lib';
import {observer} from 'mobx-react-lite';
import WebSitesMonitor from './components/WebSitesMonitor.tsx';

Typography.loadTypographies({
    h1: {fontSize: 58, fontWeight: '300', lineHeight: 80},
    counter: {fontSize: 58, fontWeight: '300', lineHeight: 80, textAlign: 'center'},
});

export default function App(): JSX.Element {
    return (
        <MainContent/>
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

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <WebSitesMonitor style={styles.sitesMonitor} urls={urlData}/>
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
    sitesMonitor: {
        width: '100%',
        padding: 8,
    },
});
