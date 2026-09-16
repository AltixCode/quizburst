import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { BannerAdSlot } from "@/components/BannerAdSlot";
import { Button, Screen, Text } from "@/components/ui";
import { t, type TranslationKey } from "@/i18n";
import { dayKeyOf } from "@/logic/day";
import { CATEGORIES, FREE_CATEGORIES, presentOptions } from "@/logic/questions";
import { useQuizStore } from "@/store/useQuizStore";
import { usePremiumStore } from "@/store/usePremiumStore";
import { useTheme, withAlpha } from "@/theme";

const MIN_TOUCH_TARGET = 44;

export default function Quiz() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();

  const isPremium = usePremiumStore((s) => s.isPremium);
  const category = useQuizStore((s) => s.category);
  const current = useQuizStore((s) => s.current);
  const chosenIndex = useQuizStore((s) => s.chosenIndex);
  const streak = useQuizStore((s) => s.streak);
  const startDay = useQuizStore((s) => s.startDay);
  const setCategory = useQuizStore((s) => s.setCategory);
  const next = useQuizStore((s) => s.next);
  const submit = useQuizStore((s) => s.submit);
  const remaining = useQuizStore((s) => s.remainingToday)(isPremium);

  const [blocked, setBlocked] = useState<"daily-cap" | "category-done" | null>(
    null,
  );

  // Once per mount, not during render.
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    startDay(dayKeyOf(today));
  }, [startDay, today]);

  const shown = current ? presentOptions(current) : null;

  const serve = useCallback(() => {
    const outcome = next(isPremium);
    setBlocked(outcome === "served" ? null : outcome);
  }, [next, isPremium]);

  const choose = useCallback(
    (index: number) => {
      if (!shown) return;
      const result = submit(index, shown.correctIndex);
      if (result === "ignored") return;
      void Haptics.notificationAsync(
        result === "right"
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    },
    [shown, submit],
  );

  const pickCategory = useCallback(
    (id: string) => {
      if (setCategory(id, isPremium) === "locked") {
        Alert.alert(t("lockedTitle"), t("unlockBody"), [
          { text: t("cancel"), style: "cancel" },
          { text: t("removeAdsCta"), onPress: () => router.push("/paywall") },
        ]);
        return;
      }
      setBlocked(null);
    },
    [setCategory, isPremium, router],
  );

  const answered = chosenIndex !== null;
  const wasRight =
    answered && shown !== null && chosenIndex === shown.correctIndex;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* topInset, because this route sets headerShown:false -- with no
          navigation header above it, nothing else pays the notch, and the
          title renders underneath the status bar. */}
      <Screen scroll topInset>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text variant="display">{t("appName")}</Text>
            <Text variant="caption" tone="muted">
              {`${t("streakLabel", { n: String(streak) })} · ${
                isPremium
                  ? t("unlimitedLabel")
                  : t("remainingLabel", { n: String(remaining) })
              }`}
            </Text>
          </View>
          <Button
            label={t("statsTitle")}
            variant="ghost"
            onPress={() => router.push("/stats")}
          />
        </View>

        <View
          style={[styles.chips, { gap: spacing.sm, marginTop: spacing.md }]}
        >
          {CATEGORIES.map((option) => {
            const locked = !isPremium && !FREE_CATEGORIES.includes(option.id);
            const name = t(option.nameKey as TranslationKey);
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityLabel={
                  locked ? t("categoryLocked", { name }) : name
                }
                accessibilityState={{ selected: category === option.id }}
                onPress={() => pickCategory(option.id)}
                style={{
                  minHeight: MIN_TOUCH_TARGET,
                  justifyContent: "center",
                  paddingHorizontal: spacing.base,
                  borderRadius: radius.full,
                  backgroundColor: colors.surfaceAlt,
                  borderWidth: category === option.id ? 2 : 1,
                  borderColor:
                    category === option.id ? colors.accent : colors.border,
                }}
              >
                <Text variant="caption">{name}</Text>
              </Pressable>
            );
          })}
        </View>

        {blocked === "daily-cap" ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text variant="bodyStrong">{t("capTitle")}</Text>
            <Text
              variant="caption"
              tone="muted"
              style={{ marginTop: spacing.xs }}
            >
              {t("capBody")}
            </Text>
            <Button
              label={t("removeAdsCta")}
              fullWidth
              onPress={() => router.push("/paywall")}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : blocked === "category-done" ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text variant="bodyStrong">{t("categoryDoneTitle")}</Text>
            <Text
              variant="caption"
              tone="muted"
              style={{ marginTop: spacing.xs }}
            >
              {t("categoryDoneBody")}
            </Text>
          </View>
        ) : current && shown ? (
          <>
            <Text variant="bodyStrong" style={{ marginTop: spacing.xl }}>
              {current.prompt}
            </Text>

            {shown.options.map((option, index) => {
              // After answering, the right option is marked whether or not it was chosen —
              // seeing which one was correct is the point of the explanation.
              const isCorrect = answered && index === shown.correctIndex;
              const isWrongPick =
                answered && index === chosenIndex && !wasRight;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={t("answerLabel", { text: option })}
                  accessibilityState={{ disabled: answered }}
                  disabled={answered}
                  onPress={() => choose(index)}
                  style={{
                    minHeight: MIN_TOUCH_TARGET,
                    justifyContent: "center",
                    paddingHorizontal: spacing.base,
                    paddingVertical: spacing.sm,
                    marginTop: spacing.sm,
                    borderRadius: radius.md,
                    backgroundColor: isCorrect
                      ? withAlpha(colors.success, 0.18)
                      : isWrongPick
                        ? withAlpha(colors.danger, 0.18)
                        : colors.surface,
                    borderWidth: 1,
                    borderColor: isCorrect
                      ? colors.success
                      : isWrongPick
                        ? colors.danger
                        : colors.border,
                  }}
                >
                  <Text variant="body">{option}</Text>
                </Pressable>
              );
            })}

            {answered ? (
              <View
                style={{
                  marginTop: spacing.md,
                  padding: spacing.base,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  variant="bodyStrong"
                  tone={wasRight ? "accent" : "danger"}
                >
                  {wasRight ? t("correctTitle") : t("wrongTitle")}
                </Text>
                {!wasRight ? (
                  <Text variant="caption" style={{ marginTop: spacing.xs }}>
                    {t("correctAnswerWas", {
                      text: shown.options[shown.correctIndex]!,
                    })}
                  </Text>
                ) : null}
                <Text
                  variant="caption"
                  tone="muted"
                  style={{ marginTop: spacing.xs }}
                >
                  {current.explanation}
                </Text>
              </View>
            ) : null}

            {answered ? (
              <Button
                label={t("nextCta")}
                fullWidth
                onPress={serve}
                style={{ marginTop: spacing.md }}
              />
            ) : null}
          </>
        ) : (
          <Button
            label={t("startCta")}
            fullWidth
            onPress={serve}
            style={{ marginTop: spacing.xl }}
          />
        )}

        <Text variant="micro" tone="faint" style={{ marginTop: spacing.lg }}>
          {t("englishOnlyNote")}
        </Text>

        <Button
          label={t("settingsTitle")}
          variant="ghost"
          fullWidth
          onPress={() => router.push("/settings")}
          style={{ marginTop: spacing.md }}
        />
      </Screen>
      <BannerAdSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center" },
  chips: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
});
