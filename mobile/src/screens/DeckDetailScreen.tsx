/**
 * Copyright (C) 2016-2026 Husain Alamri (H4n) and Xenolexia Foundation.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { DeckDetailRouteProp } from '../navigation'
import type { Card } from '../core/types'
import {
  getDeck,
  getCards,
  saveCard,
  updateCard,
  deleteCard,
} from '../core/storage'

type Nav = NativeStackNavigationProp<
  import('../navigation').RootStackParamList,
  'DeckDetail'
>

export default function DeckDetailScreen() {
  const { deckId } = useRoute<DeckDetailRouteProp>().params
  const navigation = useNavigation<Nav>()
  const [deck, setDeck] = useState<{ id: string; name: string } | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  const load = useCallback(async () => {
    const d = await getDeck(deckId)
    const c = await getCards(deckId)
    setDeck(d ?? null)
    setCards(c)
  }, [deckId])

  useEffect(() => {
    load()
  }, [load])

  const addCard = useCallback(async () => {
    const f = front.trim()
    const b = back.trim()
    if (!f || !b) return
    const card: Card = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `c-${Date.now()}`,
      deckId,
      front: f,
      back: b,
      createdAt: Date.now(),
    }
    await saveCard(card)
    setFront('')
    setBack('')
    setCards((prev) => [...prev, card])
  }, [deckId, front, back])

  const removeCard = useCallback(
    (card: Card) => {
      Alert.alert('Delete card', 'Remove this card?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCard(card.id)
            setCards((prev) => prev.filter((c) => c.id !== card.id))
          },
        },
      ])
    },
    []
  )

  const startReview = useCallback(() => {
    navigation.navigate('Review', { deckId })
  }, [deckId, navigation])

  if (!deck) return <Text style={styles.loading}>Loading…</Text>

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{deck.name}</Text>
        <TouchableOpacity style={styles.studyBtn} onPress={startReview}>
          <Text style={styles.studyBtnText}>Study</Text>
        </TouchableOpacity>
      </View>

      {cards.length === 0 ? (
        <Text style={styles.empty}>No cards yet. Add one below.</Text>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardRow}>
              <View style={styles.cardPreview}>
                <Text style={styles.cardFront} numberOfLines={1}>
                  {item.front}
                </Text>
                <Text style={styles.cardBack} numberOfLines={1}>
                  {item.back}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => removeCard(item)}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <View style={styles.addSection}>
        <Text style={styles.addTitle}>Add card</Text>
        <TextInput
          style={styles.input}
          placeholder="Front"
          value={front}
          onChangeText={setFront}
          maxLength={2000}
        />
        <TextInput
          style={styles.input}
          placeholder="Back"
          value={back}
          onChangeText={setBack}
          maxLength={2000}
        />
        <TouchableOpacity style={styles.btnPrimary} onPress={addCard}>
          <Text style={styles.btnPrimaryText}>Add</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 56, backgroundColor: '#fafafa' },
  loading: { padding: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#0a7ea4', fontSize: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '600', flex: 1 },
  studyBtn: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  studyBtnText: { color: '#fafafa', fontSize: 16 },
  empty: { color: '#666', marginBottom: 16 },
  cardRow: {
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
  cardPreview: { flex: 1, minWidth: 0 },
  cardFront: { fontWeight: '500', fontSize: 15 },
  cardBack: { fontSize: 14, color: '#666', marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { color: '#b91c1c', fontSize: 14 },
  addSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 16,
  },
  addTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  btnPrimary: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fafafa', fontSize: 16 },
})
