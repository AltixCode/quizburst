import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import Home from '../index';
import { testRouter } from './testRouter';
import { renderWithProviders } from '@/components/__tests__/renderWithProviders';
import { t } from '@/i18n';
import { dayKeyOf } from '@/logic/day';
import { FREE_CATEGORIES, presentOptions, questionsIn } from '@/logic/questions';
import { useAdsConsentStore } from '@/store/useAdsConsentStore';
import { FREE_DAILY, useQuizStore } from '@/store/useQuizStore';
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

describe('the quiz screen', () => {
  it('offers a start and shows how many are left today', async () => {
    const { getByText } = await renderWithProviders(<Home />);
    expect(getByText(t('startCta'))).toBeTruthy();
    expect(
      getByText(`${t('streakLabel', { n: '0' })} · ${t('remainingLabel', { n: String(FREE_DAILY) })}`),
    ).toBeTruthy();
  });

  it('says "no limit" to a paying player instead of a countdown', async () => {
    usePremiumStore.setState({ isPremium: true });
    const { getByText } = await renderWithProviders(<Home />);
    expect(getByText(`${t('streakLabel', { n: '0' })} · ${t('unlimitedLabel')}`)).toBeTruthy();
  });

  it('serves a question with four options', async () => {
    const { getByText, getByLabelText } = await renderWithProviders(<Home />);
    await fireEvent.press(getByText(t('startCta')));

    const question = useQuizStore.getState().current!;
    expect(getByText(question.prompt)).toBeTruthy();
    for (const option of question.options) {
      expect(getByLabelText(t('answerLabel', { text: option }))).toBeTruthy();
    }
  });

  it('shows the explanation after answering, right or wrong', async () => {
    // The explanation is free for everyone: a free tier that withholds the reason is worse
    // at teaching than one with no explanations at all.
    const { getByText, getByLabelText } = await renderWithProviders(<Home />);
    await fireEvent.press(getByText(t('startCta')));

    const question = useQuizStore.getState().current!;
    const { options, correctIndex } = presentOptions(question);
    await fireEvent.press(getByLabelText(t('answerLabel', { text: options[(correctIndex + 1) % 4]! })));

    expect(getByText(t('wrongTitle'))).toBeTruthy();
    expect(getByText(question.explanation)).toBeTruthy();
    expect(getByText(t('correctAnswerWas', { text: options[correctIndex]! }))).toBeTruthy();
  });

  it('says so when a right answer is right', async () => {
    const { getByText, getByLabelText } = await renderWithProviders(<Home />);
    await fireEvent.press(getByText(t('startCta')));
    const { options, correctIndex } = presentOptions(useQuizStore.getState().current!);
    await fireEvent.press(getByLabelText(t('answerLabel', { text: options[correctIndex]! })));
    expect(getByText(t('correctTitle'))).toBeTruthy();
  });

  it('stops a free player at the daily cap and offers the purchase', async () => {
    useQuizStore.setState({
      todayKey: dayKeyOf(new Date()),
      answeredToday: questionsIn(FREE).slice(0, FREE_DAILY).map((q) => q.id),
    });
    const { getByText } = await renderWithProviders(<Home />);
    await fireEvent.press(getByText(t('startCta')));

    expect(getByText(t('capTitle'))).toBeTruthy();
    await fireEvent.press(getByText(t('removeAdsCta')));
    expect(testRouter.push).toHaveBeenCalledWith('/paywall');
  });

  it('distinguishes an emptied category from the daily cap', async () => {
    usePremiumStore.setState({ isPremium: true });
    useQuizStore.setState({
      todayKey: dayKeyOf(new Date()),
      answeredToday: questionsIn(FREE).map((q) => q.id),
    });
    const { getByText } = await renderWithProviders(<Home />);
    await fireEvent.press(getByText(t('startCta')));
    expect(getByText(t('categoryDoneTitle'))).toBeTruthy();
  });

  it('sends a free player tapping a locked category to the paywall', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByLabelText } = await renderWithProviders(<Home />);
    await fireEvent.press(getByLabelText(t('categoryLocked', { name: t('catNature') })));
    expect(alert.mock.calls[0]![0]).toBe(t('lockedTitle'));
    expect(useQuizStore.getState().category).toBe(FREE);
  });

  it('says the questions are English rather than implying they are translated', async () => {
    const { getByText } = await renderWithProviders(<Home />);
    expect(getByText(t('englishOnlyNote'))).toBeTruthy();
  });

  it('routes to stats and settings', async () => {
    const { getByText } = await renderWithProviders(<Home />);
    await fireEvent.press(getByText(t('statsTitle')));
    expect(testRouter.push).toHaveBeenCalledWith('/stats');
    await fireEvent.press(getByText(t('settingsTitle')));
    expect(testRouter.push).toHaveBeenCalledWith('/settings');
  });
});
