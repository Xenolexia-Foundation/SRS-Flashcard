/**
 * Copyright (C) 2016-2026 Husain Alamri (H4n) and Xenolexia Foundation.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE.
 */

import { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { ReviewRouteProp } from '../navigation'
import type { Card } from '../core/types'
import type { ReviewOutcome } from '../core/types'
import { getDueCards, recordReview } from '../core/storage'

type Nav = NativeStackNavigationProp<
  import('../navigation').RootStackParamList,
  'Review'
>

const OUTCOMES: ReviewOutcome[] = ['again', 'hard', 'good', 'easy']

export default function ReviewScreen() {
  const { deckId } = useRoute<ReviewRouteProp>().params
  const navigation = useNavigation<Nav>()
  const [queue, setQueue] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const due = await getDueCards(deckId)
    setQueue(due)
    setIndex(0)
    setRevealed(false)
    setLoading(false)
  }, [deckId])

  useEffect(() => {
    load()
  }, [load])

  const handleOutcome = useCallback(
    async (outcome: ReviewOutcome) => {
      const card = queue[index]
      if (!card) return
      await recordReview(card.id, outcome)
      if (index + 1 >= queue.length) {
        navigation.goBack()
      } else {
        setIndex((i) => i + 1)
        setRevealed(false)
      }
    },
    [queue, index, navigation]
  )

  const goBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  if (loading) return <Text style={styles.center}>Loading…</Text>

  if (queue.length === 0) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.empty}>No cards due right now.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={goBack}>
          <Text style={styles.doneBtnText}>Back to deck</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const card = queue[index]
  if (!card) return null

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={goBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Exit</Text>
      </TouchableOpacity>
      <Text style={styles.progress}>
        {index + 1} of {queue.length}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardFront}>{card.front}</Text>
        {!revealed ? (
          <TouchableOpacity
            style={styles.showBtn}
            onPress={() => setRevealed(true)}
          >
            <Text style={styles.showBtnText}>Show answer</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.cardBack}>{card.back}</Text>
            <View style={styles.ratingRow}>
              {OUTCOMES.map((outcome) => (
                <TouchableOpacity
                  key={outcome}
                  style={styles.ratingBtn}
                  onPress={() => handleOutcome(outcome)}
                >
                  <Text style={styles.ratingBtnText}>
                    {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 56, backgroundColor: '#fafafa' },
  center: { flex: 1, textAlign: 'center', paddingTop: 100 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#0a7ea4', fontSize: 16 },
  progress: { fontSize: 14, color: '#666', marginBottom: 12 },
  empty: { color: '#666', marginBottom: 16, textAlign: 'center' },
  card: {
    padding: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 16,
  },
  cardFront: { fontSize: 18, lineHeight: 26 },
  cardBack: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  showBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  showBtnText: { color: '#0a7ea4', fontSize: 16 },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  ratingBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  ratingBtnText: { fontSize: 14 },
  doneBtn: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fafafa', fontSize: 16 },
})
