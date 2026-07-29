import { SolarNotebookBold } from '@/components/icons/solar-icons';
import { Colors } from '@/constants/theme';
import { useDirection } from '@/i18n';
import React, { useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export interface PredefinedTerm {
  id: string;
  title: { ar: string; en?: string };
  content: { ar: string; en?: string };
}

interface PredefinedTermsPickerProps {
  terms: PredefinedTerm[] | undefined;
  /** Set of term ids that are already added to the chalet's rules. */
  selectedIds: Set<string>;
  onToggle: (term: PredefinedTerm) => void;
  isRTL: boolean;
  loading?: boolean;
  /** Disables interaction (e.g. while a toggle is being persisted). */
  busy?: boolean;
}

/** A chalet rule that may have originated from a ready-made term. */
export interface TermLinkedRule {
  titleAr: string;
  /** Set when the rule was added by tapping a ready-made term in this session. */
  termId?: string;
  /** Set when the owner wrote the rule themselves — never matched onto a term. */
  isCustom?: boolean;
}

/**
 * Resolves, for each rule, which ready-made term it came from — returned in the
 * same order as `rules` (`undefined` = a custom rule).
 *
 * Rules are persisted with their text only, so a rule loaded from the server has
 * to be matched back to a term by Arabic title. Terms are *claimed*: when the
 * admin has two terms sharing a title, each one can only back a single rule, so
 * selecting one no longer lights up the other. An explicit `termId` always wins.
 */
export function resolveRuleTermIds(
  rules: TermLinkedRule[],
  terms: PredefinedTerm[] | undefined,
): (string | undefined)[] {
  const allTermIds = new Set((terms || []).map((t) => t.id));
  const idsByTitle = new Map<string, string[]>();
  (terms || []).forEach((t) => {
    const key = (t.title?.ar || '').trim();
    const list = idsByTitle.get(key);
    if (list) list.push(t.id);
    else idsByTitle.set(key, [t.id]);
  });

  // Explicitly linked rules claim their term first, so title matching can't steal it.
  const claimed = new Set<string>();
  rules.forEach((r) => {
    if (r.termId && allTermIds.has(r.termId)) claimed.add(r.termId);
  });

  return rules.map((r) => {
    if (r.termId && allTermIds.has(r.termId)) return r.termId;
    // A rule the owner wrote stays custom even if it happens to share a title.
    if (r.isCustom) return undefined;
    const candidates = idsByTitle.get((r.titleAr || '').trim()) || [];
    const free = candidates.find((id) => !claimed.has(id));
    if (!free) return undefined;
    claimed.add(free);
    return free;
  });
}

/**
 * Lets the owner pick from the admin-managed list of ready-made rules — mirrors
 * the portal's "الشروط الجاهزة" multi-select: a flat list of selectable rows
 * with a small square checkmark. Pure presentational; the parent owns the rules
 * array and persistence. Selection is keyed by term id — see
 * {@link resolveRuleTermIds} for how saved rules map back onto terms.
 */
export function PredefinedTermsPicker({
  terms,
  selectedIds,
  onToggle,
  isRTL,
  loading,
  busy,
}: PredefinedTermsPickerProps) {
  // The container mirrors logical layout, so use plain 'row' + leading aligns.
  const { textAlign } = useDirection();

  const selectedCount = useMemo(
    () => (terms || []).filter((t) => selectedIds.has(t.id)).length,
    [terms, selectedIds],
  );

  return (
    <View>
      {/* Section header */}
      <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
            const isSelected = selectedIds.has(term.id);
            const title = isRTL ? term.title?.ar : term.title?.en || term.title?.ar;
            const content = isRTL ? term.content?.ar : term.content?.en || term.content?.ar;
            return (
              <TouchableOpacity
                key={term.id}
                activeOpacity={0.7}
                disabled={busy}
                onPress={() => onToggle(term)}
                style={{
                  flexDirection: 'row',
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
                <View style={{ flex: 1, alignItems: 'flex-start' }}>
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
