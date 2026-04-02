/**
 * Copyright (C) 2016-2026 Husain Alamri (H4n) and Xenolexia Foundation.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE.
 */

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('react-native/Libraries/Core/ReactNativeVersion') as {
    default?: { minor?: number };
    minor?: number;
  };
  const v =
    mod && typeof mod === 'object' && 'default' in mod && mod.default ? mod.default : mod;
  const minor = v && typeof v === 'object' && typeof v.minor === 'number' ? v.minor : undefined;
  if (typeof minor !== 'number' || (minor >= 74 && minor <= 84)) {
    /* supported 0.74.x–0.84.x semver-minor band */
  } else {
    console.warn(
      `[SRS Flashcard] React Native 0.${minor}.x is outside the supported semver-minor band (74–84).`,
    );
  }
} catch {
  /* not a React Native bundle */
}
