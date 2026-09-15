import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BannerAdSlot } from '@/components/BannerAdSlot';
import { Screen, Text } from '@/components/ui';
import { t, type TranslationKey } from '@/i18n';
import { CATEGORIES } from '@/logic/questions';
import { useQuizStore } from '@/store/useQuizStore';
import { useTheme } from '@/theme';

/**
 * Answered, correct and accuracy per category.
 *
 * Shown to everyone. The paywall sells the *stats*, and the numbers are a record of what the
 * player did — withholding them would be withholding the player's own history from them.
 * What the purchase buys is the categories that produce more of them, and the daily cap.
 */
export default function Stats() {
  const { colors, spacing, radius } = useTheme();

  const stats = useQuizStore((s) => s.stats);
  const streak = useQuizStore((s) => s.streak);
  const rows = CATEGORIES.map((c) => ({ category: c, stat: stats[c.id] })).filter(
    (r) => r.stat && r.stat.answered > 0,
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen scroll>
        <Text variant="display">{t('statsTitle')}</Text>
        <Text variant="caption" tone="muted">
          {t('streakLabel', { n: String(streak) })}
        </Text>

        {rows.length === 0 ? (
          <Text variant="caption" tone="muted" style={{ marginTop: spacing.md }}>
            {t('statsEmpty')}
          </Text>
        ) : (
          rows.map(({ category, stat }) => (
            <View
              key={category.id}
              style={{
                marginTop: spacing.sm,
                padding: spacing.base,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text variant="bodyStrong">{t(category.nameKey as TranslationKey)}</Text>
              <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
                {t('statsRow', {
                  correct: String(stat!.correct),
                  answered: String(stat!.answered),
                  percent: String(Math.round((stat!.correct / stat!.answered) * 100)),
                })}
              </Text>
            </View>
          ))
        )}
      </Screen>
      <BannerAdSlot />
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
