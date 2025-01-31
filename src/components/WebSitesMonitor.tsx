import { Text, View } from 'react-native-ui-lib';
import React from 'react';
import { ScrollView, StyleProp, StyleSheet } from 'react-native';

interface UrlStatusItemProps {
    url: string,
    status: string,
}

interface WebSitesMonitorProps {
    urls: UrlStatusItemProps[],
    style?: StyleProp<any>,
}

// @ts-ignore
const SiteStatus = ({ statusItem }) => (
    <View style={styles.listItemContainer}>
        <View style={[
            listItemIndicatorStyles.indicator,
            // @ts-ignore
            listItemIndicatorStyles[statusItem.state],
        ]} />
        <Text style={styles.listItem}>
            {statusItem.url}
        </Text>
    </View>
);

const WebSitesMonitor: React.FC<WebSitesMonitorProps> = ({ urls, style }) => {
    return (
        <View style={style}>
            <View style={styles.container}>
                <Text style={styles.containerTitle}>WebSites Monitor</Text>
                <ScrollView style={styles.list}>
                    {urls.map((statusItem, index) => {
                        return <SiteStatus statusItem={statusItem} key={`wsb-${index}`} />;
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
        backgroundColor: '#48bb78',
        shadowColor: '#48bb78',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 3,
    },

    inactive: {
        backgroundColor: '#f56565',
        shadowColor: '#f56565',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 3,
    },
});

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        margin: 16,
    },
    list: {
        margin: 16,
    },
    listItem: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2d3748',
    },
    listItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#f7fafc',
        borderRadius: 8,
    },
    containerTitle: {
        margin: 16,
        fontSize: 24,
        fontWeight: '600',
        color: '#1a202c',
    },
});

export default WebSitesMonitor;
