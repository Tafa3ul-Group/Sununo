import { act, fireEvent, render, screen } from "@testing-library/react-native";
import i18next, { type i18n as I18nInstance } from "i18next";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { I18nextProvider, initReactI18next } from "react-i18next";

import ar from "@/i18n/ar.json";
import en from "@/i18n/en.json";

// The `@/i18n` barrel boots i18next against AsyncStorage on import; these tests
// drive their own instances, so swap it for the pure direction module.
jest.mock("@/i18n", () => jest.requireActual("@/i18n/direction"));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

import * as Haptics from "expo-haptics";

import { CountdownBadge } from "@/components/dashboard/countdown-badge";
import { AppButton } from "@/components/user/app-button";
import { AuthToggle } from "@/components/user/auth-toggle";
import { CategoryTabs } from "@/components/user/category-tabs";
import { GuestCounter } from "@/components/user/guest-counter";
import { OtpInput, type OtpInputHandle } from "@/components/user/otp-input";
import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button";

function makeI18n(lng: "ar" | "en"): I18nInstance {
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    lng,
    fallbackLng: lng,
    resources: { ar: { translation: ar }, en: { translation: en } },
    interpolation: { escapeValue: false },
  });
  return instance;
}
const arI18n = makeI18n("ar");
const enI18n = makeI18n("en");

function renderUI(ui: React.ReactElement, lang: "ar" | "en" = "ar") {
  return render(
    <I18nextProvider i18n={lang === "en" ? enI18n : arI18n}>{ui}</I18nextProvider>,
  );
}

/** Flattened style of the nearest host element rendering `text`. */
const styleOf = (node: any) => StyleSheet.flatten(node.props.style) ?? {};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("PrimaryButton", () => {
  it("renders the label and fires onPress exactly once", () => {
    const onPress = jest.fn();
    renderUI(<PrimaryButton label="تأكيد الحجز" onPress={onPress} />);
    expect(screen.getByText("تأكيد الحجز")).toBeTruthy();

    fireEvent.press(screen.getByText("تأكيد الحجز"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire onPress while disabled (double-submit guard)", () => {
    const onPress = jest.fn();
    renderUI(<PrimaryButton label="تأكيد" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText("تأكيد"));
    fireEvent.press(screen.getByText("تأكيد"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("swaps the whole button for a spinner while loading — the label is gone and unpressable", () => {
    const onPress = jest.fn();
    renderUI(<PrimaryButton label="تأكيد" onPress={onPress} loading />);
    expect(screen.queryByText("تأكيد")).toBeNull();
    expect(screen.UNSAFE_getAllByType(ActivityIndicator)).toHaveLength(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("plays haptic feedback before invoking onPress", () => {
    const onPress = jest.fn();
    renderUI(<PrimaryButton label="تأكيد" onPress={onPress} />);
    fireEvent.press(screen.getByText("تأكيد"));
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("still calls onPress when the haptics engine rejects", () => {
    (Haptics.impactAsync as jest.Mock).mockReturnValueOnce(
      Promise.reject(new Error("unsupported")),
    );
    const onPress = jest.fn();
    renderUI(<PrimaryButton label="تأكيد" onPress={onPress} />);
    expect(() => fireEvent.press(screen.getByText("تأكيد"))).not.toThrow();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders an icon next to the label", () => {
    renderUI(
      <PrimaryButton label="تأكيد" onPress={jest.fn()} icon={<Text>ICON</Text>} />,
    );
    expect(screen.getByText("ICON")).toBeTruthy();
    expect(screen.getByText("تأكيد")).toBeTruthy();
  });

  it("paints white label text when active and the accent colour when inactive", () => {
    renderUI(<PrimaryButton label="نشط" onPress={jest.fn()} />);
    expect(styleOf(screen.getByText("نشط")).color).toBe("white");

    screen.unmount();
    renderUI(<PrimaryButton label="غير نشط" onPress={jest.fn()} isActive={false} />);
    expect(styleOf(screen.getByText("غير نشط")).color).toBe("#035DF9");
  });

  it("renders an empty label without crashing", () => {
    expect(() =>
      renderUI(<PrimaryButton label="" onPress={jest.fn()} />),
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("SecondaryButton", () => {
  it("renders the label and fires onPress exactly once", () => {
    const onPress = jest.fn();
    renderUI(<SecondaryButton label="تصفية" onPress={onPress} />);
    fireEvent.press(screen.getByText("تصفية"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire onPress while isLoading (double-submit guard)", () => {
    const onPress = jest.fn();
    renderUI(<SecondaryButton label="تصفية" onPress={onPress} isLoading />);
    fireEvent.press(screen.getByText("تصفية"));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.UNSAFE_getAllByType(ActivityIndicator)).toHaveLength(1);
  });

  it("keeps the label visible while loading (unlike PrimaryButton) and dims the button", () => {
    renderUI(<SecondaryButton label="تصفية" onPress={jest.fn()} isLoading />);
    expect(screen.getByText("تصفية")).toBeTruthy();
    const touchable = screen.UNSAFE_getAllByType(TouchableOpacity)[0];
    expect(styleOf(touchable).opacity).toBe(0.7);
  });

  it("prefers iconLabel over an icon node", () => {
    renderUI(
      <SecondaryButton
        label="السعر"
        onPress={jest.fn()}
        iconLabel="٥"
        icon={<Text>NODE_ICON</Text>}
      />,
    );
    expect(screen.getByText("٥")).toBeTruthy();
    expect(screen.queryByText("NODE_ICON")).toBeNull();
  });

  it("renders a string icon as text and a node icon as-is", () => {
    renderUI(<SecondaryButton label="نجوم" onPress={jest.fn()} icon={"★"} />);
    expect(screen.getByText("★")).toBeTruthy();

    screen.unmount();
    renderUI(<SecondaryButton label="نجوم" onPress={jest.fn()} icon={<Text>NODE</Text>} />);
    expect(screen.getByText("NODE")).toBeTruthy();
  });

  it("renders only the label when there is no icon, iconLabel or spinner", () => {
    renderUI(<SecondaryButton label="فقط" onPress={jest.fn()} />);
    expect(screen.getAllByText(/./)).toHaveLength(1);
  });

  it("puts the icon on the logical start by default and on the end for iconPosition='right'", () => {
    // Layout is authored LTR; the container `direction` mirrors it for Arabic,
    // so the component only ever picks row vs row-reverse.
    renderUI(<SecondaryButton label="أ" onPress={jest.fn()} iconLabel="1" />);
    expect(styleOf(screen.UNSAFE_getAllByType(TouchableOpacity)[0]).flexDirection).toBe("row");

    screen.unmount();
    renderUI(
      <SecondaryButton label="أ" onPress={jest.fn()} iconLabel="1" iconPosition="right" />,
    );
    expect(styleOf(screen.UNSAFE_getAllByType(TouchableOpacity)[0]).flexDirection).toBe(
      "row-reverse",
    );
  });

  it("uses the active colours only when isActive is true", () => {
    renderUI(<SecondaryButton label="مفعل" onPress={jest.fn()} isActive />);
    expect(styleOf(screen.getByText("مفعل")).color).toBe("white");

    screen.unmount();
    renderUI(<SecondaryButton label="غير مفعل" onPress={jest.fn()} />);
    expect(styleOf(screen.getByText("غير مفعل")).color).toBe("#035DF9");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("AppButton", () => {
  it("renders the label and fires onPress once (primary variant)", () => {
    const onPress = jest.fn();
    renderUI(<AppButton label="إضافة" onPress={onPress} />);
    fireEvent.press(screen.getByText("إضافة"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire onPress while disabled, in either variant", () => {
    const onPress = jest.fn();
    renderUI(<AppButton label="إضافة" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText("إضافة"));
    expect(onPress).not.toHaveBeenCalled();

    screen.unmount();
    const onPress2 = jest.fn();
    renderUI(<AppButton label="إضافة" onPress={onPress2} variant="secondary" disabled />);
    fireEvent.press(screen.getByText("إضافة"));
    expect(onPress2).not.toHaveBeenCalled();
  });

  it("replaces the button with a spinner while loading", () => {
    const onPress = jest.fn();
    renderUI(<AppButton label="إضافة" onPress={onPress} loading />);
    expect(screen.queryByText("إضافة")).toBeNull();
    expect(screen.UNSAFE_getAllByType(ActivityIndicator)).toHaveLength(1);
  });

  it("loading wins over the secondary variant too", () => {
    renderUI(<AppButton label="إضافة" onPress={jest.fn()} variant="secondary" loading />);
    expect(screen.queryByText("إضافة")).toBeNull();
  });

  it("renders leftLabel in the icon slot of the secondary variant", () => {
    renderUI(
      <AppButton label="الشفت" onPress={jest.fn()} variant="secondary" leftLabel="٢" />,
    );
    expect(screen.getByText("٢")).toBeTruthy();
    expect(screen.getByText("الشفت")).toBeTruthy();
  });

  it("prefers leftLabel over the icon node in the secondary variant", () => {
    renderUI(
      <AppButton
        label="الشفت"
        onPress={jest.fn()}
        variant="secondary"
        leftLabel="٢"
        icon={<Text>NODE_ICON</Text>}
      />,
    );
    expect(screen.getByText("٢")).toBeTruthy();
    expect(screen.queryByText("NODE_ICON")).toBeNull();
  });

  it("omits the icon slot when neither icon nor leftLabel is supplied", () => {
    renderUI(<AppButton label="الشفت" onPress={jest.fn()} variant="secondary" />);
    expect(screen.getAllByText(/./)).toHaveLength(1);
  });

  it("falls back to the accent colour for the inactive label when no inactiveTextColor is given", () => {
    renderUI(<AppButton label="غير نشط" onPress={jest.fn()} isActive={false} />);
    expect(styleOf(screen.getByText("غير نشط")).color).toBe("#035DF9");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("OtpInput", () => {
  const getInput = () => screen.UNSAFE_getByType(TextInput);

  it("renders one box per digit and shows the digits it is given", () => {
    renderUI(<OtpInput code="12" setCode={jest.fn()} />);
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getAllByText(/[0-9]/)).toHaveLength(2);
  });

  it("pushes typed digits up to the parent", () => {
    const setCode = jest.fn();
    renderUI(<OtpInput code="" setCode={setCode} />);
    fireEvent.changeText(getInput(), "1");
    expect(setCode).toHaveBeenCalledWith("1");
  });

  it("strips non-digits out of the entered text", () => {
    const setCode = jest.fn();
    renderUI(<OtpInput code="" setCode={setCode} />);
    fireEvent.changeText(getInput(), "12a3-4 ");
    expect(setCode).toHaveBeenCalledWith("1234");
  });

  it("rejects Arabic-Indic digits, which /[^0-9]/ does not accept", () => {
    // Worth pinning: the app is Arabic-first, and an Arabic keyboard can emit
    // ١٢٣ — the field silently drops them rather than mis-parsing them.
    const setCode = jest.fn();
    const onComplete = jest.fn();
    renderUI(<OtpInput code="" setCode={setCode} onComplete={onComplete} />);
    fireEvent.changeText(getInput(), "١٢٣٤٥٦");
    expect(setCode).toHaveBeenCalledWith("");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("clears the code when the text is entirely non-numeric", () => {
    const setCode = jest.fn();
    renderUI(<OtpInput code="123" setCode={setCode} />);
    fireEvent.changeText(getInput(), "abc");
    expect(setCode).toHaveBeenCalledWith("");
  });

  it("truncates a pasted code longer than `length`", () => {
    const setCode = jest.fn();
    const onComplete = jest.fn();
    renderUI(<OtpInput code="" setCode={setCode} onComplete={onComplete} />);
    fireEvent.changeText(getInput(), "1234567890");
    expect(setCode).toHaveBeenCalledWith("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("handles backspace: shortening the text reports the shorter code and does not complete", () => {
    const setCode = jest.fn();
    const onComplete = jest.fn();
    renderUI(<OtpInput code="123" setCode={setCode} onComplete={onComplete} />);
    fireEvent.changeText(getInput(), "12");
    expect(setCode).toHaveBeenCalledWith("12");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("does not call onComplete for a partial code", () => {
    const onComplete = jest.fn();
    renderUI(<OtpInput code="" setCode={jest.fn()} onComplete={onComplete} />);
    fireEvent.changeText(getInput(), "12345");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("calls onComplete exactly once, with the full code, when the last digit lands", () => {
    const onComplete = jest.fn();
    renderUI(<OtpInput code="12345" setCode={jest.fn()} onComplete={onComplete} />);
    fireEvent.changeText(getInput(), "123456");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("does not fire onComplete when the parent sets a full code programmatically", () => {
    // The dev-mode OTP echoed back by the API must not auto-submit.
    const onComplete = jest.fn();
    const { rerender } = renderUI(
      <OtpInput code="" setCode={jest.fn()} onComplete={onComplete} />,
    );
    rerender(
      <I18nextProvider i18n={arI18n}>
        <OtpInput code="123456" setCode={jest.fn()} onComplete={onComplete} />
      </I18nextProvider>,
    );
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("honours a custom length for both the boxes and the completion threshold", () => {
    const onComplete = jest.fn();
    const setCode = jest.fn();
    renderUI(<OtpInput code="" setCode={setCode} onComplete={onComplete} length={4} />);
    fireEvent.changeText(getInput(), "1234");
    expect(setCode).toHaveBeenCalledWith("1234");
    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("works with no onComplete handler at all", () => {
    const setCode = jest.fn();
    renderUI(<OtpInput code="" setCode={setCode} />);
    expect(() => fireEvent.changeText(getInput(), "123456")).not.toThrow();
    expect(setCode).toHaveBeenCalledWith("123456");
  });

  it("exposes an imperative focus() that does not throw", () => {
    const ref = React.createRef<OtpInputHandle>();
    renderUI(<OtpInput ref={ref} code="" setCode={jest.fn()} />);
    expect(typeof ref.current?.focus).toBe("function");
    expect(() => ref.current?.focus()).not.toThrow();
  });

  it("tapping the boxes focuses the hidden input rather than swallowing the tap", () => {
    renderUI(<OtpInput code="" setCode={jest.fn()} />);
    const boxes = screen.UNSAFE_getAllByType(TouchableOpacity)[0];
    expect(() => fireEvent.press(boxes)).not.toThrow();
  });

  it("renders a code longer than `length` without crashing (defensive)", () => {
    expect(() =>
      renderUI(<OtpInput code="123456789" setCode={jest.fn()} length={6} />),
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GuestCounter", () => {
  const buttons = () => screen.UNSAFE_getAllByType(TouchableOpacity);
  const minus = () => buttons()[0];
  const plus = () => buttons()[1];

  it("renders the current value", () => {
    renderUI(<GuestCounter value={3} onIncrement={jest.fn()} onDecrement={jest.fn()} />);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("renders zero, negative and very large values as given", () => {
    for (const value of [0, -5, 999999]) {
      renderUI(
        <GuestCounter value={value} onIncrement={jest.fn()} onDecrement={jest.fn()} />,
      );
      expect(screen.getByText(String(value))).toBeTruthy();
      screen.unmount();
    }
  });

  it("calls onIncrement — and only onIncrement — when plus is pressed", () => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    renderUI(
      <GuestCounter value={1} onIncrement={onIncrement} onDecrement={onDecrement} />,
    );
    fireEvent.press(plus());
    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).not.toHaveBeenCalled();
  });

  it("calls onDecrement — and only onDecrement — when minus is pressed", () => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    renderUI(
      <GuestCounter value={1} onIncrement={onIncrement} onDecrement={onDecrement} />,
    );
    fireEvent.press(minus());
    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(onIncrement).not.toHaveBeenCalled();
  });

  it("is fully controlled: it does NOT clamp at zero itself — the parent's handler must", () => {
    // Documented contract, not an oversight: every call site clamps with
    // Math.max(0, …). The component always reports the intent.
    const onDecrement = jest.fn();
    renderUI(<GuestCounter value={0} onIncrement={jest.fn()} onDecrement={onDecrement} />);
    fireEvent.press(minus());
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it("a parent that clamps keeps the displayed value at the floor", () => {
    // The behaviour the user actually sees, wired the way the screens wire it.
    function Clamped() {
      const [value, setValue] = React.useState(0);
      return (
        <GuestCounter
          value={value}
          onIncrement={() => setValue((v) => Math.min(2, v + 1))}
          onDecrement={() => setValue((v) => Math.max(0, v - 1))}
        />
      );
    }
    renderUI(<Clamped />);

    fireEvent.press(minus());
    fireEvent.press(minus());
    expect(screen.getByText("0")).toBeTruthy();

    fireEvent.press(plus());
    fireEvent.press(plus());
    fireEvent.press(plus());
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("does not fire the handlers on press-in alone (only on a completed press)", () => {
    const onIncrement = jest.fn();
    renderUI(
      <GuestCounter value={1} onIncrement={onIncrement} onDecrement={jest.fn()} />,
    );
    fireEvent(plus(), "pressIn");
    expect(onIncrement).not.toHaveBeenCalled();
  });

  it("plays selection haptics on press-in", () => {
    renderUI(<GuestCounter value={1} onIncrement={jest.fn()} onDecrement={jest.fn()} />);
    fireEvent(plus(), "pressIn");
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  // Like every other haptics call site in the app (primary-button,
  // secondary-button, circle-back-button all end in `.catch(() => {})`), the two
  // onPressIn handlers here guard the promise. On a device where the API rejects
  // (no haptic engine, Android throttling) a bare call became an unhandled
  // promise rejection.
  it("attaches a rejection handler to the haptics promise", () => {
    const catchSpy = jest.fn(() => Promise.resolve());
    (Haptics.selectionAsync as jest.Mock).mockReturnValueOnce({ catch: catchSpy });
    renderUI(<GuestCounter value={1} onIncrement={jest.fn()} onDecrement={jest.fn()} />);
    fireEvent(plus(), "pressIn");
    expect(catchSpy).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("CategoryTabs", () => {
  const cats = [
    { id: "all", label: "الكل", icon: () => null, activeColor: "#035DF9" },
    { id: "chalet", label: "شاليه", icon: () => null, activeColor: "#F64200" },
    { id: "farm", label: "مزرعة", icon: () => null, activeColor: "#10B981" },
  ];

  it("renders every category label", () => {
    renderUI(<CategoryTabs categories={cats} activeId="all" onSelect={jest.fn()} />);
    for (const c of cats) expect(screen.getByText(c.label)).toBeTruthy();
  });

  it("calls onSelect with the pressed category id", () => {
    const onSelect = jest.fn();
    renderUI(<CategoryTabs categories={cats} activeId="all" onSelect={onSelect} />);
    fireEvent.press(screen.getByText("مزرعة"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("farm");
  });

  it("does not call onSelect on mount", () => {
    const onSelect = jest.fn();
    renderUI(<CategoryTabs categories={cats} activeId="all" onSelect={onSelect} />);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("re-selecting the already active tab still reports the selection", () => {
    const onSelect = jest.fn();
    renderUI(<CategoryTabs categories={cats} activeId="all" onSelect={onSelect} />);
    fireEvent.press(screen.getByText("الكل"));
    expect(onSelect).toHaveBeenCalledWith("all");
  });

  it("tells each icon whether its own tab is active", () => {
    const icon = jest.fn((isActive: boolean) => (
      <Text>{isActive ? "ACTIVE" : "IDLE"}</Text>
    ));
    renderUI(
      <CategoryTabs
        categories={cats.map((c) => ({ ...c, icon }))}
        activeId="chalet"
        onSelect={jest.fn()}
      />,
    );
    expect(screen.getAllByText("ACTIVE")).toHaveLength(1);
    expect(screen.getAllByText("IDLE")).toHaveLength(2);
  });

  it("paints only the active tab with its activeColor", () => {
    renderUI(<CategoryTabs categories={cats} activeId="chalet" onSelect={jest.fn()} />);
    const tabs = screen.UNSAFE_getAllByType(TouchableOpacity);
    const painted = tabs.filter((t) => styleOf(t).backgroundColor === "#F64200");
    expect(painted).toHaveLength(1);
    expect(tabs.filter((t) => styleOf(t).backgroundColor !== undefined)).toHaveLength(1);
  });

  it("renders an empty strip for an empty category list without crashing", () => {
    renderUI(<CategoryTabs categories={[]} activeId="" onSelect={jest.fn()} />);
    expect(screen.queryAllByText(/./)).toHaveLength(0);
  });

  it("paints nothing when activeId matches no category", () => {
    renderUI(<CategoryTabs categories={cats} activeId="ghost" onSelect={jest.fn()} />);
    const tabs = screen.UNSAFE_getAllByType(TouchableOpacity);
    expect(tabs.filter((t) => styleOf(t).backgroundColor !== undefined)).toHaveLength(0);
  });

  it("keeps SOURCE order in both languages (direction model v3)", () => {
    // Under native RTL the OS mirrors the strip and its scroll offsets, so the
    // first chip already lands on the leading (right) edge in Arabic. The v2
    // `useRtlListOrder` reversal is now a no-op — reversing on top of a natively
    // mirrored list flipped it back, which is what put "الكل" on the wrong end.
    const expected = ["الكل", "شاليه", "مزرعة"];

    renderUI(<CategoryTabs categories={cats} activeId="all" onSelect={jest.fn()} />, "ar");
    expect(screen.getAllByText(/./).map((n) => n.props.children)).toEqual(expected);

    screen.unmount();
    renderUI(<CategoryTabs categories={cats} activeId="all" onSelect={jest.fn()} />, "en");
    expect(screen.getAllByText(/./).map((n) => n.props.children)).toEqual(expected);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("AuthToggle", () => {
  it("renders both role labels from the active language", () => {
    renderUI(<AuthToggle activeType="owner" onChange={jest.fn()} />);
    expect(screen.getByText("صاحب شاليه")).toBeTruthy();
    expect(screen.getByText("مستأجر")).toBeTruthy();

    screen.unmount();
    renderUI(<AuthToggle activeType="owner" onChange={jest.fn()} />, "en");
    expect(screen.getByText("Chaleh Owner")).toBeTruthy();
    expect(screen.getByText("Customer")).toBeTruthy();
  });

  it("reports the tapped role", () => {
    const onChange = jest.fn();
    renderUI(<AuthToggle activeType="owner" onChange={onChange} />);

    fireEvent.press(screen.getByText("مستأجر"));
    expect(onChange).toHaveBeenLastCalledWith("customer");

    fireEvent.press(screen.getByText("صاحب شاليه"));
    expect(onChange).toHaveBeenLastCalledWith("owner");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("does not call onChange on mount or on a re-render of the active type", () => {
    const onChange = jest.fn();
    const { rerender } = renderUI(<AuthToggle activeType="owner" onChange={onChange} />);
    rerender(
      <I18nextProvider i18n={arI18n}>
        <AuthToggle activeType="customer" onChange={onChange} />
      </I18nextProvider>,
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("blocks both taps while disabled (submission in flight)", () => {
    const onChange = jest.fn();
    renderUI(<AuthToggle activeType="owner" onChange={onChange} disabled />);
    fireEvent.press(screen.getByText("مستأجر"));
    fireEvent.press(screen.getByText("صاحب شاليه"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("CountdownBadge", () => {
  const NOW = new Date("2026-08-12T10:00:00.000Z").getTime();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  /** ISO timestamp `minutesAgo` minutes before the frozen "now". */
  const createdMinutesAgo = (minutesAgo: number) =>
    new Date(NOW - minutesAgo * 60_000).toISOString();

  it("shows the full remaining time for a booking created just now", () => {
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(0)} />);
    expect(screen.getByText("01:00:00")).toBeTruthy();
  });

  it("ticks down once per second", () => {
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(0)} />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("00:59:59")).toBeTruthy();
  });

  it("shows the expired label once the window has passed", () => {
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(120)} />);
    expect(screen.getByText("منتهي")).toBeTruthy();

    screen.unmount();
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(120)} />, "en");
    expect(screen.getByText("Expired")).toBeTruthy();
  });

  it("treats an exactly-elapsed window as expired", () => {
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(60)} durationHours={1} />);
    expect(screen.getByText("منتهي")).toBeTruthy();
  });

  it("switches to the urgent colour under 15 minutes remaining", () => {
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(50)} />);
    expect(styleOf(screen.getByText("00:10:00")).color).toBe("#E11D48");

    screen.unmount();
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(30)} />);
    expect(styleOf(screen.getByText("00:30:00")).color).toBe("#EA580C");
  });

  it("uses the expired colour, not the urgent one, once time is up", () => {
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(90)} />);
    expect(styleOf(screen.getByText("منتهي")).color).toBe("#EF4444");
  });

  it("renders the card variant with a heading and the timer", () => {
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(0)} variant="card" />);
    expect(screen.getByText("الوقت المتبقي للقبول")).toBeTruthy();
    expect(screen.getByText("01:00:00")).toBeTruthy();

    screen.unmount();
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(0)} variant="card" />, "en");
    expect(screen.getByText("Time remaining to accept")).toBeTruthy();
  });

  it("renders the expired card with a zeroed clock", () => {
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(600)} variant="card" />);
    expect(screen.getByText("انتهى وقت القبول")).toBeTruthy();
    expect(screen.getByText("00:00:00")).toBeTruthy();
  });

  it("honours a custom durationHours, including very large ones", () => {
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(0)} durationHours={3} />);
    expect(screen.getByText("03:00:00")).toBeTruthy();

    screen.unmount();
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(0)} durationHours={10000} />);
    expect(screen.getByText("10000:00:00")).toBeTruthy();
  });

  it("treats a zero or negative durationHours as already expired", () => {
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(0)} durationHours={0} />);
    expect(screen.getByText("منتهي")).toBeTruthy();

    screen.unmount();
    renderUI(<CountdownBadge createdAt={createdMinutesAgo(0)} durationHours={-3} />);
    expect(screen.getByText("منتهي")).toBeTruthy();
  });

  it("treats an empty createdAt as expired instead of rendering a broken clock", () => {
    renderUI(<CountdownBadge createdAt="" />);
    expect(screen.getByText("منتهي")).toBeTruthy();
  });

  // `new Date("خطأ").getTime()` is NaN, so `diff` used to be NaN and `diff <= 0`
  // was false — the expiry guard in hooks/useCountdown.ts was skipped and the
  // badge rendered the literal string "NaN:NaN:NaN" to the user, forever.
  it("treats an unparseable createdAt as expired rather than showing NaN", () => {
    renderUI(<CountdownBadge createdAt="not-a-real-date" />);
    expect(screen.queryByText("NaN:NaN:NaN")).toBeNull();
    expect(screen.getByText("منتهي")).toBeTruthy();
  });
});
