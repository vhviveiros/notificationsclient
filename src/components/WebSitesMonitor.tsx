import { Text, View } from 'react-native-ui-lib';
import React, { useState } from 'react';
import { ScrollView, StyleProp, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import WebSiteMonitorState from '../state/WebSiteMonitorState';
import { observer } from 'mobx-react-lite';

interface WebSitesMonitorProps {
    webSiteMonitorState: WebSiteMonitorState,
    style?: StyleProp<any>,
}

interface SiteStatusProps {
    statusItem: {
        name: string;
        url: string;
        isUp: boolean;
    };
    onPress: () => void;
}

// Make SiteStatus observed as well
const SiteStatus = observer(({ statusItem, onPress }: SiteStatusProps) => (
    <TouchableOpacity onPress={onPress}>
        <View style={listItemIndicatorStyles.listItemContainer}>
            <View style={[
                listItemIndicatorStyles.indicator,
                listItemIndicatorStyles[statusItem.isUp ? 'active' : 'inactive'],
            ]} />
            <Text style={listItemIndicatorStyles.listItem}>
                {statusItem.name}
            </Text>
        </View>
    </TouchableOpacity>
));

const WebSitesMonitor: React.FC<WebSitesMonitorProps> = observer(({ webSiteMonitorState, style }) => {
    const [selectedSite, setSelectedSite] = useState<null | typeof webSiteMonitorState.sites[0]>(null);
    const [isDialogVisible, setIsDialogVisible] = useState(false);

    const handleSitePress = (site: typeof webSiteMonitorState.sites[0]) => {
        setSelectedSite(site);
        setIsDialogVisible(true);
    };

    return (
        <View style={style}>
            <View style={styles.container}>
                <Text style={styles.containerTitle}>WebSites Monitor</Text>
                <ScrollView style={styles.list}>
                    {Object.values(webSiteMonitorState.sites).map((statusItem, index) => (
                        <SiteStatus
                            statusItem={statusItem}
                            key={`wsb-${index}`}
                            onPress={() => handleSitePress(statusItem)}
                        />
                    ))}

                </ScrollView>
            </View>

            <Modal
                visible={isDialogVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsDialogVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsDialogVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            activeOpacity={1}
                            style={styles.modalContent}
                        >
                            {selectedSite && (
                                <View>
                                    <View style={styles.dialogHeader}>
                                        <Text style={styles.dialogTitle}>{selectedSite.name}</Text>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: selectedSite.isUp ? '#48bb78' : '#f56565' }
                                        ]}>
                                            <Text style={styles.statusText}>
                                                {selectedSite.isUp ? 'Online' : 'Offline'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.dialogContent}>
                                        <Text style={styles.urlLabel}>URL:</Text>
                                        <Text style={styles.urlText}>{selectedSite.url}</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => setIsDialogVisible(false)}
                                    >
                                        <Text style={styles.closeButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
});

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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxWidth: 400,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dialogHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    dialogTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a202c',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    dialogContent: {
        marginBottom: 20,
    },
    urlLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4a5568',
        marginBottom: 4,
    },
    urlText: {
        fontSize: 15,
        color: '#2d3748',
    },
    closeButton: {
        backgroundColor: '#4299e1',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default WebSitesMonitor;
