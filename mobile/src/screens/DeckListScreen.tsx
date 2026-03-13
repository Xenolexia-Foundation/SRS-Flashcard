import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { Deck } from '../core/types'
import { getDecks, saveDeck } from '../core/storage'
import type { RootStackParamList } from '../navigation'

type Nav = NativeStackNavigationProp<RootStackParamList, 'DeckList'>

export default function DeckListScreen() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [newName, setNewName] = useState('')
  const navigation = useNavigation<Nav>()

  const load = useCallback(async () => {
    const list = await getDecks()
    setDecks(list)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addDeck = useCallback(async () => {
    const name = newName.trim()
    if (!name) return
    const deck: Deck = {
      id: crypto.randomUUID?.() ?? `d-${Date.now()}`,
      name,
      createdAt: Date.now(),
    }
    await saveDeck(deck)
    setNewName('')
    setDecks((prev) => [...prev, deck])
    navigation.navigate('DeckDetail', { deckId: deck.id })
  }, [newName, navigation])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Decks</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Deck name"
          value={newName}
          onChangeText={setNewName}
          maxLength={200}
          onSubmitEditing={addDeck}
        />
        <TouchableOpacity style={styles.btnPrimary} onPress={addDeck}>
          <Text style={styles.btnPrimaryText}>New deck</Text>
        </TouchableOpacity>
      </View>
      {decks.length === 0 ? (
        <Text style={styles.empty}>No decks yet. Create one above.</Text>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.deckRow}
              onPress={() => navigation.navigate('DeckDetail', { deckId: item.id })}
            >
              <Text style={styles.deckName}>{item.name}</Text>
              <Text style={styles.openLabel}>Open</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 56, backgroundColor: '#fafafa' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  btnPrimary: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  btnPrimaryText: { color: '#fafafa', fontSize: 16 },
  empty: { color: '#666', marginTop: 8 },
  deckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  deckName: { fontWeight: '500', fontSize: 16 },
  openLabel: { color: '#0a7ea4', fontSize: 14 },
})
