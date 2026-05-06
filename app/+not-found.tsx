import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/components/ui/error-state';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: t('common.error', 'خطأ'), headerShown: false }} />
      <ErrorState 
        type="error404"
        onBack={() => router.replace('/')}
        backLabel={t('common.goBackHome', 'العودة للرئيسية')}
      />
    </>
  );
}
