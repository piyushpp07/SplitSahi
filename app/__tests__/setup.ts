import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    },
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useFocusEffect: jest.fn(),
}));

jest.mock('expo-constants', () => ({
    __esModule: true,
    default: {
        expoConfig: {
            hostUri: 'localhost:8081',
            extra: {
                eas: {
                    projectId: 'test-project-id',
                },
            },
        },
    },
}));

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getExpoPushTokenAsync: jest.fn(),
    addNotificationReceivedListener: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    AndroidImportance: {
        MAX: 5,
    },
}));

jest.mock('expo-device', () => ({
    isDevice: true,
}));

// Silence console warnings in tests
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
};
