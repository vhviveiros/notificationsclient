import {Text, View} from 'react-native-ui-lib';
import React from 'react';
import {ScrollView, StyleProp, StyleSheet} from 'react-native';

interface UrlStatusItemProps {
    url: string,
    status: string,
}

interface WebSitesMonitorProps {
    urls: UrlStatusItemProps[],
    style?: StyleProp<any>,
}

// @ts-ignore
const SiteStatus = ({statusItem, index}) => (
    <View style={styles.listItemContainer}>
        <View style={[
            listItemIndicatorStyles.indicator,
            // @ts-ignore
            listItemIndicatorStyles[statusItem.status],
        ]}/>
        <Text style={styles.listItem} key={`listItem ${index}`}>
            {statusItem.url}
        </Text>
    </View>
);

const WebSitesMonitor: React.FC<WebSitesMonitorProps> = ({urls, style}) => {
    return (
        <View style={style}>
            <View style={styles.container}>
                <Text style={styles.containerTitle}>WebSites Monitor</Text>
                <ScrollView style={styles.list}>
                    {urls.map((statusItem, index) => {
                        return <SiteStatus statusItem={statusItem} index={index}/>;
                    })}
                </ScrollView>
            </View>
        </View>
    );
};

const listItemIndicatorStyles = StyleSheet.create({
    indicator: {
        width: 18,
        height: 18,
        borderRadius: 6, // Half of width/height for perfect circle
        alignSelf: 'center',
        marginRight: 12,
    },

    active: {
        backgroundColor: 'rgba(76,175,80,0.5)', // Green for true/connected
        shadowColor: 'rgba(76,175,80,0.5)',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.7,
        shadowRadius: 5,
        elevation: 5,
    },

    inactive: {
        backgroundColor: 'rgba(244,67,54,0.5)',
        shadowColor: 'rgba(244,67,54,0.5)',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.7,
        shadowRadius: 5,
        elevation: 5,
    },
});

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        backgroundColor: '#eafffc',
        boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
    },
    list: {
        margin: 12,
    },
    listItem: {
        fontSize: 18,
        fontWeight: 'normal',
        lineHeight: 22,
    },
    listItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    containerTitle: {
        marginHorizontal: 8,
        fontSize: 20,
        fontWeight: '500',
        lineHeight: 50,
    },
});

export default WebSitesMonitor;
