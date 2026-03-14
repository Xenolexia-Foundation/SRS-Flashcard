/**
 * Copyright (C) 2016-2026 Husain Alamri (H4n) and Xenolexia Foundation.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE.
 */

import type { RouteProp } from '@react-navigation/native'

export type RootStackParamList = {
  DeckList: undefined
  DeckDetail: { deckId: string }
  Review: { deckId: string }
}

export type DeckDetailRouteProp = RouteProp<RootStackParamList, 'DeckDetail'>
export type ReviewRouteProp = RouteProp<RootStackParamList, 'Review'>
