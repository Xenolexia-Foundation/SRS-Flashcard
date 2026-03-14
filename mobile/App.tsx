/**
 * Copyright (C) 2016-2026 Husain Alamri (H4n) and Xenolexia Foundation.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE.
 */

import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import DeckListScreen from './src/screens/DeckListScreen'
import DeckDetailScreen from './src/screens/DeckDetailScreen'
import ReviewScreen from './src/screens/ReviewScreen'
import type { RootStackParamList } from './src/navigation'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fafafa' },
          }}
        >
          <Stack.Screen name="DeckList" component={DeckListScreen} />
          <Stack.Screen name="DeckDetail" component={DeckDetailScreen} />
          <Stack.Screen name="Review" component={ReviewScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  )
}
