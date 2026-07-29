import { SolarNotebookBold, SolarPenBold, SolarTrashBinBold } from '@/components/icons/solar-icons';
import { AiTranslateButton } from '@/components/ui/ai-translate-button';
import { Colors, normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface CustomRuleItem {
  id: string;
  titleAr: string;
  titleEn?: string;
  descriptionAr: string;
  descriptionEn?: string;
  /** Unchecked rules stay in the list but are not saved. Defaults to true. */
  enabled?: boolean;
}

/** The editable fields of a rule — what the edit sheet returns. */
export type CustomRuleDraft = Pick<
  CustomRuleItem,
  'titleAr' | 'titleEn' | 'descriptionAr' | 'descriptionEn'
>;

interface CustomRulesEditorProps {
  rules: CustomRuleItem[];
  /** Append a new rule (already filled in by the sheet). */
  onCreate: (draft: CustomRuleDraft) => void;
  onChange: (id: string, patch: Partial<CustomRuleItem>) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  isRTL: boolean;
}

const emptyDraft: CustomRuleDraft = { titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '' };

/**
 * The chalet's own rules, shown with the same selectable card as the ready-made
 * terms (`PredefinedTermsPicker`): tap the card to include/exclude it, the pen
 * to edit its text, the bin to delete it. Editing happens in a sheet so the list
 * itself stays a compact, uniform list instead of a wall of inputs.
 *
 * Shared by add-chalet and chalet-details so both screens stay identical.
 */
export function CustomRulesEditor({
  rules,
  onCreate,
  onChange,
  onToggle,
  onRemove,
  isRTL,
}: CustomRulesEditorProps) {
  const { rowDirection, textAlign } = useDirection();
  const flexRow = rowDirection;

  const sheetRef = useRef<BottomSheetModal>(null);
  // `null` = not editing, '' = creating a new rule, otherwise the rule's id.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomRuleDraft>(emptyDraft);

  const selectedCount = rules.filter((r) => r.enabled !== false).length;

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const openCreate = () => {
    setDraft(emptyDraft);
    setEditingId('');
    sheetRef.current?.present();
  };

  const openEdit = (rule: CustomRuleItem) => {
    setDraft({
      titleAr: rule.titleAr,
      titleEn: rule.titleEn || '',
      descriptionAr: rule.descriptionAr,
      descriptionEn: rule.descriptionEn || '',
    });
    setEditingId(rule.id);
    sheetRef.current?.present();
  };

  const closeSheet = () => sheetRef.current?.dismiss();

  const canSaveDraft = !!draft.titleAr.trim() || !!draft.descriptionAr.trim();

  const saveDraft = () => {
    if (!canSaveDraft) return;
    if (editingId) onChange(editingId, draft);
    else onCreate(draft);
    closeSheet();
  };

  const renderField = (opts: {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (v: string) => void;
    multiline?: boolean;
    /** Arabic source for the AI-translate pill; omit on Arabic fields. */
    translateSource?: string;
    onTranslated?: (en: string) => void;
  }) => (
    <View style={{ gap: 5 }}>
      <View style={[styles.fieldLabelRow, { flexDirection: flexRow }]}>
        {/* Placed by the RTL container's own mirroring — no textAlign here, an
            explicit one gets flipped on Text inside an rtl subtree. */}
        <View style={styles.fieldLabelWrap}>
          <Text style={styles.fieldLabel}>{opts.label}</Text>
        </View>
        {opts.onTranslated && (
          <AiTranslateButton source={opts.translateSource || ''} onTranslated={opts.onTranslated} />
        )}
      </View>
      <BottomSheetTextInput
        style={[styles.ruleInput, opts.multiline && styles.ruleArea, { textAlign }]}
        placeholder={opts.placeholder}
        placeholderTextColor="#CBD5E1"
        multiline={opts.multiline}
        value={opts.value}
        onChangeText={opts.onChangeText}
      />
    </View>
  );

  return (
    <View>
      {/* Header + add button — mirrors the ready-made terms header */}
      <View style={[styles.header, { flexDirection: flexRow }]}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <View style={[styles.headerTitleRow, { flexDirection: flexRow }]}>
            <Text style={styles.headerTitle}>{isRTL ? 'شروط مخصّصة' : 'Custom Rules'}</Text>
            {selectedCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {isRTL ? `${selectedCount} مختارة` : `${selectedCount} selected`}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            {isRTL ? 'شروط خاصة بهذا الشاليه فقط' : 'Rules specific to this chalet'}
          </Text>
        </View>
        <TouchableOpacity onPress={openCreate} activeOpacity={0.8} style={[styles.addBtn, { flexDirection: flexRow }]}>
          <Text style={styles.addBtnPlus}>+</Text>
          <Text style={styles.addBtnText}>{isRTL ? 'إضافة شرط' : 'Add Rule'}</Text>
        </TouchableOpacity>
      </View>

      {rules.length === 0 ? (
        <View style={styles.emptyBox}>
          <SolarNotebookBold size={26} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {isRTL
              ? 'لا توجد شروط مخصّصة. اضغط «إضافة شرط» لإضافة شرط خاص بهذا الشاليه.'
              : 'No custom rules. Tap "Add Rule" to add one specific to this chalet.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {rules.map((rule, index) => {
            const isSelected = rule.enabled !== false;
            const title = (isRTL ? rule.titleAr : rule.titleEn || rule.titleAr).trim();
            const content = (isRTL ? rule.descriptionAr : rule.descriptionEn || rule.descriptionAr).trim();
            return (
              <TouchableOpacity
                key={rule.id}
                activeOpacity={0.7}
                onPress={() => onToggle(rule.id)}
                style={[
                  styles.ruleCard,
                  { flexDirection: flexRow },
                  isSelected && styles.ruleCardSelected,
                ]}
              >
                {/* Circle checkbox — identical to the ready-made terms card */}
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>

                <View style={{ flex: 1, alignItems: 'flex-start' }}>
                  <Text style={styles.ruleTitle}>
                    {title || (isRTL ? `شرط ${index + 1} (بدون عنوان)` : `Rule ${index + 1} (untitled)`)}
                  </Text>
                  {!!content && (
                    <Text numberOfLines={2} style={styles.ruleContent}>
                      {content}
                    </Text>
                  )}
                </View>

                {/* Edit / delete */}
                <View style={[styles.cardActions, { flexDirection: flexRow }]}>
                  <TouchableOpacity
                    onPress={() => openEdit(rule)}
                    hitSlop={6}
                    style={styles.iconBtn}
                  >
                    <SolarPenBold size={14} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onRemove(rule.id)}
                    hitSlop={6}
                    style={[styles.iconBtn, styles.iconBtnDanger]}
                  >
                    <SolarTrashBinBold size={14} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Edit / create sheet — stacks over the rules sheet (stackBehavior
          'switch' restores it on dismiss) and inherits the app's rtl root. */}
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={['85%']}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24, backgroundColor: '#FFFFFF' }}
        handleIndicatorStyle={{ backgroundColor: '#CBD5E1', width: 36 }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onDismiss={() => setEditingId(null)}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {editingId
              ? isRTL ? 'تعديل الشرط' : 'Edit Rule'
              : isRTL ? 'شرط جديد' : 'New Rule'}
          </Text>

          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderField({
              label: isRTL ? 'العنوان (عربي)' : 'Title (AR)',
              placeholder: isRTL ? 'عنوان الشرط بالعربية' : 'Rule title in Arabic',
              value: draft.titleAr,
              onChangeText: (v) => setDraft((d) => ({ ...d, titleAr: v })),
            })}
            {renderField({
              label: isRTL ? 'الشرح (عربي)' : 'Description (AR)',
              placeholder: isRTL ? 'شرح الشرط بالعربية' : 'Rule description in Arabic',
              value: draft.descriptionAr,
              onChangeText: (v) => setDraft((d) => ({ ...d, descriptionAr: v })),
              multiline: true,
            })}
            {renderField({
              label: isRTL ? 'العنوان (إنجليزي)' : 'Title (EN)',
              placeholder: 'Rule title in English',
              value: draft.titleEn || '',
              onChangeText: (v) => setDraft((d) => ({ ...d, titleEn: v })),
              translateSource: draft.titleAr,
              onTranslated: (en) => setDraft((d) => ({ ...d, titleEn: en })),
            })}
            {renderField({
              label: isRTL ? 'الشرح (إنجليزي)' : 'Description (EN)',
              placeholder: 'Rule description in English',
              value: draft.descriptionEn || '',
              onChangeText: (v) => setDraft((d) => ({ ...d, descriptionEn: v })),
              multiline: true,
              translateSource: draft.descriptionAr,
              onTranslated: (en) => setDraft((d) => ({ ...d, descriptionEn: en })),
            })}
          </BottomSheetScrollView>

          <View style={[styles.modalActions, { flexDirection: flexRow }]}>
            <TouchableOpacity onPress={closeSheet} activeOpacity={0.8} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveDraft}
              activeOpacity={0.8}
              disabled={!canSaveDraft}
              style={[styles.saveBtn, !canSaveDraft && { backgroundColor: '#CBD5E1' }]}
            >
              <Text style={styles.saveBtnText}>{isRTL ? 'حفظ' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  headerTitleRow: { alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 15, fontFamily: 'Alexandria-Bold', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, fontFamily: 'Alexandria-Regular', color: '#94A3B8', marginTop: 3 },
  countBadge: {
    backgroundColor: Colors.primary + '14',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countBadgeText: { fontSize: 11, fontFamily: 'Alexandria-Bold', color: Colors.primary },
  addBtn: {
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnPlus: { fontSize: 16, color: Colors.primary, fontFamily: 'Alexandria-Bold', marginTop: -2 },
  addBtnText: { fontSize: 12, color: Colors.primary, fontFamily: 'Alexandria-Bold' },
  emptyBox: {
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Alexandria-Medium',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
  },
  // ── Rule card — same shape as PredefinedTermsPicker's rows ──
  ruleCard: {
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8EBF0',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ruleCardSelected: { borderColor: Colors.primary + '55', backgroundColor: '#F2F7FF' },
  checkbox: {
    marginTop: 1,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  checkboxSelected: { backgroundColor: Colors.primary, borderWidth: 0 },
  checkmark: { color: '#FFF', fontSize: 12, fontFamily: 'Alexandria-Bold', marginTop: -1 },
  ruleTitle: { fontSize: 13, fontFamily: 'Alexandria-Bold', color: '#1E293B' },
  ruleContent: {
    fontSize: 11.5,
    fontFamily: 'Alexandria-Regular',
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
  },
  cardActions: { alignItems: 'center', gap: 6, marginTop: 1 },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDanger: { backgroundColor: '#FEF2F2' },
  // ── Edit sheet ──
  modalCard: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Alexandria-Bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalActions: { gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontFamily: 'Alexandria-Bold', color: '#64748B' },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontFamily: 'Alexandria-Bold', color: '#FFF' },
  fieldLabelRow: { alignItems: 'center', justifyContent: 'space-between', minHeight: 30, gap: 8 },
  fieldLabelWrap: { flex: 1, alignItems: 'flex-start' },
  fieldLabel: { fontSize: 11, fontFamily: 'Alexandria-Medium', color: '#94A3B8' },
  ruleInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Regular',
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ruleArea: { minHeight: 64, paddingTop: 10, textAlignVertical: 'top' },
});
