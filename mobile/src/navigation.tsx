import type { RouteProp } from '@react-navigation/native'

export type RootStackParamList = {
  DeckList: undefined
  DeckDetail: { deckId: string }
  Review: { deckId: string }
}

export type DeckDetailRouteProp = RouteProp<RootStackParamList, 'DeckDetail'>
export type ReviewRouteProp = RouteProp<RootStackParamList, 'Review'>
