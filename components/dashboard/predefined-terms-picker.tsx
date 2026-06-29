import { SolarNotebookBold } from '@/components/icons/solar-icons';
import { Colors } from '@/constants/theme';
import { useDirection } from '@/i18n';
import React, { useMemo } from 'react';
import { ActivityIndicator, I18nManager, Text, TouchableOpacity, View } from 'react-native';

export interface PredefinedTerm {
  id: string;
  title: { ar: string; en?: string };
  content: { ar: string; en?: string };
}

interface PredefinedTermsPickerProps {
  terms: PredefinedTerm[] | undefined;
  /** Set of titleAr values that are already added to the chalet's rules. */
  selectedTitles: Set<string>;
  onToggle: (term: PredefinedTerm) => void;
  isRTL: boolean;
  loading?: boolean;
  /** Disables interaction (e.g. while a toggle is being persisted). */
  busy?: boolean;
}

/**
 * Lets the owner pick from the admin-managed list of ready-made rules — mirrors
 * the portal's "الشروط الجاهزة" multi-select: a flat list of selectable rows
 * with a small square checkmark. Pure presentational; the parent owns the rules
 * array and persistence. Selection is matched by Arabic title.
 */
export function PredefinedTermsPicker({
  terms,
  selectedTitles,
  onToggle,
  isRTL,
  loading,
  busy,
}: PredefinedTermsPickerProps) {
  // Use the app's manager-aware helpers (the codebase flips rows manually via
  // rowDirection / flexStart — relying on raw isRTL ternaries breaks when the
  // native I18nManager direction differs).
  const { rowDirection } = useDirection();
  const flexRow = rowDirection;
  const flexStart = isRTL
    ? (I18nManager.isRTL ? 'flex-start' : 'flex-end')
    : (I18nManager.isRTL ? 'flex-end' : 'flex-start');
  const textAlign = isRTL ? 'right' : 'left';

  const selectedCount = useMemo(
    () => (terms || []).filter((t) => selectedTitles.has(t.title?.ar)).length,
    [terms, selectedTitles],
  );

  return (
    <View>
      {/* Section header */}
      <View style={{ alignItems: flexStart, marginBottom: 12 }}>
        <View style={{ flexDirection: flexRow, alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 15, fontFamily: 'Alexandria-Bold', color: '#0F172A', textAlign }}>
            {isRTL ? 'الشروط الجاهزة' : 'Ready-made Rules'}
          </Text>
          {selectedCount > 0 && (
            <View
              style={{
                backgroundColor: Colors.primary + '14',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: 'Alexandria-Bold', color: Colors.primary }}>
                {isRTL ? `${selectedCount} مختارة` : `${selectedCount} selected`}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, fontFamily: 'Alexandria-Regular', color: '#94A3B8', marginTop: 3, textAlign }}>
          {isRTL ? 'اختر من الشروط المعرّفة مسبقاً لإضافتها' : 'Choose from predefined rules to add'}
        </Text>
      </View>

      {/* Body */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
      ) : !terms || terms.length === 0 ? (
        <View
          style={{
            borderRadius: 12,
            backgroundColor: '#F8FAFC',
            borderWidth: 1,
            borderColor: '#EEF2F6',
            paddingVertical: 22,
            alignItems: 'center',
            gap: 8,
          }}
        >
          <SolarNotebookBold size={26} color="#CBD5E1" />
          <Text style={{ fontSize: 12, fontFamily: 'Alexandria-Medium', color: '#94A3B8', textAlign: 'center' }}>
            {isRTL ? 'لا توجد شروط جاهزة متاحة' : 'No ready-made rules available'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8, opacity: busy ? 0.6 : 1 }}>
          {terms.map((term) => {
            const isSelected = selectedTitles.has(term.title?.ar);
            const title = isRTL ? term.title?.ar : term.title?.en || term.title?.ar;
            const content = isRTL ? term.content?.ar : term.content?.en || term.content?.ar;
            return (
              <TouchableOpacity
                key={term.id}
                activeOpacity={0.7}
                disabled={busy}
                onPress={() => onToggle(term)}
                style={{
                  flexDirection: flexRow,
                  alignItems: 'flex-start',
                  gap: 12,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: isSelected ? Colors.primary + '55' : '#E8EBF0',
                  backgroundColor: isSelected ? '#F2F7FF' : '#FFF',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                {/* Circle checkbox — matches the app's amenity selection cards */}
                <View
                  style={{
                    marginTop: 1,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: isSelected ? Colors.primary : '#FFF',
                    borderWidth: isSelected ? 0 : 2,
                    borderColor: '#CBD5E1',
                  }}
                >
                  {isSelected && (
                    <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Alexandria-Bold', marginTop: -1 }}>✓</Text>
                  )}
                </View>
                {/* Texts */}
                <View style={{ flex: 1, alignItems: flexStart }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Alexandria-Bold',
                      color: '#1E293B',
                      textAlign,
                    }}
                  >
                    {title}
                  </Text>
                  {!!content && (
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 11.5,
                        fontFamily: 'Alexandria-Regular',
                        color: '#64748B',
                        marginTop: 3,
                        lineHeight: 18,
                        textAlign,
                      }}
                    >
                      {content}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
