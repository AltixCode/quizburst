import React from 'react';

import Stats from '../stats';
import { renderWithProviders } from '@/components/__tests__/renderWithProviders';
import { t } from '@/i18n';
import { FREE_CATEGORIES } from '@/logic/questions';
import { useAdsConsentStore } from '@/store/useAdsConsentStore';
import { useQuizStore } from '@/store/useQuizStore';
import { usePremiumStore } from '@/store/usePremiumStore';

const FREE = FREE_CATEGORIES[0]!;

beforeEach(() => {
  jest.clearAllMocks();
  usePremiumStore.setState({ isPremium: false, isReady: true });
  useAdsConsentStore.setState({ consent: { canServeAds: true, offerPrivacyOptions: false } });
  useQuizStore.setState({
    category: FREE,
    answeredToday: [],
    todayKey: null,
    stats: {},
    streak: 0,
    lastPlayedKey: null,
    current: null,
    chosenIndex: null,
  });
});

describe('the stats screen', () => {
  it('says so when nothing has been answered', async () => {
    const { getByText } = await renderWithProviders(<Stats />);
    expect(getByText(t('statsEmpty'))).toBeTruthy();
  });

  it('shows a category record with its accuracy', async () => {
    useQuizStore.setState({ stats: { [FREE]: { answered: 8, correct: 6 } }, streak: 3 });
    const { getByText } = await renderWithProviders(<Stats />);
    expect(getByText(t('statsRow', { correct: '6', answered: '8', percent: '75' }))).toBeTruthy();
    expect(getByText(t('streakLabel', { n: '3' }))).toBeTruthy();
  });

  it('hides a category with nothing answered rather than showing a zero row', async () => {
    useQuizStore.setState({ stats: { [FREE]: { answered: 0, correct: 0 } } });
    const { getByText } = await renderWithProviders(<Stats />);
    expect(getByText(t('statsEmpty'))).toBeTruthy();
  });

  it('shows the record to a free player — it is their own history', async () => {
    useQuizStore.setState({ stats: { [FREE]: { answered: 4, correct: 4 } } });
    const { getByText } = await renderWithProviders(<Stats />);
    expect(getByText(t('statsRow', { correct: '4', answered: '4', percent: '100' }))).toBeTruthy();
  });
});
