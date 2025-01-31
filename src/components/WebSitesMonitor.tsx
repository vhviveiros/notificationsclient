import { Text, View } from 'react-native-ui-lib';
import React from 'react';
import { ScrollView, StyleProp, StyleSheet } from 'react-native';

interface UrlStatusItemProps {
    url: string,
    status: 'active' | 'inactive',
}

interface WebSitesMonitorProps {
    urls: UrlStatusItemProps[],
    style?: StyleProp<any>,
}

// @ts-ignore
const SiteStatus = ({ statusItem }) => (
    <View style={listItemIndicatorStyles.listItemContainer}>
        <View style={[
            listItemIndicatorStyles.indicator,
            // @ts-ignore
            listItemIndicatorStyles[statusItem.status],
        ]} />
        <Text style={listItemIndicatorStyles.listItem}>
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
    listItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingRight: 12,
        backgroundColor: '#f7fafc',
        borderRadius: 8,
    },
    listItem: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2d3748',
        paddingTop: 12,
        paddingBottom: 12,
    },
    indicator: {
        width: 6,
        height: '100%',
        marginRight: 12,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 3,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
    },
    active: {
        backgroundColor: '#48bb78',
        shadowColor: '#48bb78',
    },

    inactive: {
        backgroundColor: '#f56565',
        shadowColor: '#f56565',
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
    },
    list: {
        margin: 16,
    },
    containerTitle: {
        margin: 16,
        fontSize: 24,
        fontWeight: '600',
        color: '#1a202c',
    },
});

export default WebSitesMonitor;
