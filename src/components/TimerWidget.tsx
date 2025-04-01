import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { View } from 'react-native-ui-lib';
import { observer } from 'mobx-react-lite';

interface TimerWidgetProps {
    remainingMinutes: number;
    isRunning: boolean;
    onCancel: () => void;
}

const TimerWidget: React.FC<TimerWidgetProps> = observer(({ remainingMinutes, isRunning, onCancel }) => {
    if (!isRunning) return null;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.timerText}>
                    Sleep timer: {remainingMinutes}m remaining
                </Text>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: '#4299e1',
        borderRadius: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timerText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#2b6cb0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    cancelText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default TimerWidget; 