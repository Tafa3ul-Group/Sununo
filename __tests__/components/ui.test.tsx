import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen } from "@testing-library/react-native";
import i18next, { type i18n as I18nInstance } from "i18next";
import React from "react";
import { Text, View } from "react-native";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { Provider } from "react-redux";

import ar from "@/i18n/ar.json";
import en from "@/i18n/en.json";

// The `@/i18n` barrel boots i18next against AsyncStorage the moment it is
// imported; these tests drive their own instances, so swap the barrel for the
// pure direction module it re-exports (that is all the components consume).
jest.mock("@/i18n", () => jest.requireActual("@/i18n/direction"));

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

import * as Haptics from "expo-haptics";

import { CircleBackButton } from "@/components/ui/circle-back-button";
import { Collapsible } from "@/components/ui/collapsible";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PressableScale } from "@/components/ui/pressable-scale";
import { StatusModal } from "@/components/ui/status-modal";
import authReducer, { type UserType } from "@/store/authSlice";

// ── i18n: two real instances so language is picked per-render, never mutated
// mid-test (changing language on a mounted tree needs act() and buys nothing).
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

// Combine up front: handing `configureStore` a reducer *map* alongside a
// preloaded state makes TS resolve the `Reducer` overload instead of the
// `ReducersMapObject` one, so the slice map stops typechecking. A pre-combined
// root reducer keeps the preloaded state fully checked against AuthState.
const rootReducer = combineReducers({ auth: authReducer });

function makeStore(userType: UserType = null) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      auth: {
        user: null,
        token: null,
        userType,
        accountType: null,
        isAuthenticated: false,
        language: "ar" as const,
        selectedChalet: null,
      },
    },
  });
}

function renderUI(
  ui: React.ReactElement,
  opts: { lang?: "ar" | "en"; userType?: UserType } = {},
) {
  return render(
    <Provider store={makeStore(opts.userType ?? null)}>
      <I18nextProvider i18n={opts.lang === "en" ? enI18n : arI18n}>
        {ui}
      </I18nextProvider>
    </Provider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCanGoBack.mockReturnValue(true);
});

// ─────────────────────────────────────────────────────────────────────────────
describe("EmptyState", () => {
  it("falls back to the translated 'no data' title when no title is passed", () => {
    renderUI(<EmptyState />);
    expect(screen.getByText("لا توجد بيانات")).toBeTruthy();
  });

  it("uses the English copy when the app language is English", () => {
    renderUI(<EmptyState />, { lang: "en" });
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it("renders the supplied title and description", () => {
    renderUI(<EmptyState title="لا توجد حجوزات" description="ابدأ بحجز شاليه" />);
    expect(screen.getByText("لا توجد حجوزات")).toBeTruthy();
    expect(screen.getByText("ابدأ بحجز شاليه")).toBeTruthy();
  });

  it("treats an empty-string title as absent and falls back to the default", () => {
    renderUI(<EmptyState title="" />);
    expect(screen.getByText("لا توجد بيانات")).toBeTruthy();
  });

  it("renders no description block when the description is empty or missing", () => {
    renderUI(<EmptyState title="عنوان" description="" />);
    // The only text on screen is the title.
    expect(screen.getAllByText(/./)).toHaveLength(1);
  });

  it("renders the custom icon instead of the default inbox glyph", () => {
    renderUI(<EmptyState icon={<Text>CUSTOM_ICON</Text>} />);
    expect(screen.getByText("CUSTOM_ICON")).toBeTruthy();
  });

  it("shows the action button only when BOTH actionLabel and onAction are given", () => {
    renderUI(<EmptyState actionLabel="أعد المحاولة" />);
    expect(screen.queryByText("أعد المحاولة")).toBeNull();

    screen.unmount();
    renderUI(<EmptyState onAction={jest.fn()} />);
    // Nothing to label the button with — only the fallback title renders.
    expect(screen.getAllByText(/./)).toHaveLength(1);
  });

  it("fires onAction exactly once when the action button is pressed", () => {
    const onAction = jest.fn();
    renderUI(<EmptyState actionLabel="أعد المحاولة" onAction={onAction} />);
    fireEvent.press(screen.getByText("أعد المحاولة"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders very long unicode content without crashing", () => {
    const long = "شاليه ".repeat(200).trim();
    renderUI(<EmptyState title={long} description="🏖️🌴 emoji + عربي" />);
    expect(screen.getByText(long)).toBeTruthy();
    expect(screen.getByText("🏖️🌴 emoji + عربي")).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("ErrorState", () => {
  it("renders the generic failure copy by default", () => {
    renderUI(<ErrorState />);
    expect(screen.getByText("خطأ")).toBeTruthy();
    expect(screen.getByText("يرجى المحاولة مرة أخرى.")).toBeTruthy();
  });

  it("renders the 404 copy for type='error404'", () => {
    renderUI(<ErrorState type="error404" />);
    expect(screen.getByText("الصفحة غير موجودة")).toBeTruthy();
    expect(screen.getByText("نعتذر، لم نجد ما تبحث عنه.")).toBeTruthy();
  });

  it("prefers the explicit title and message over the type defaults", () => {
    renderUI(<ErrorState type="error404" title="عنوان مخصص" message="رسالة مخصصة" />);
    expect(screen.getByText("عنوان مخصص")).toBeTruthy();
    expect(screen.getByText("رسالة مخصصة")).toBeTruthy();
    expect(screen.queryByText("الصفحة غير موجودة")).toBeNull();
  });

  it("hides the message row entirely for message=\"\" (title-only mode)", () => {
    // `message !== ""` is a deliberate opt-out, distinct from `undefined`.
    renderUI(<ErrorState message="" />);
    expect(screen.getByText("خطأ")).toBeTruthy();
    expect(screen.queryByText("يرجى المحاولة مرة أخرى.")).toBeNull();
  });

  it("renders no action buttons when neither handler is supplied", () => {
    renderUI(<ErrorState />);
    expect(screen.queryByText("إعادة المحاولة")).toBeNull();
    expect(screen.queryByText("العودة")).toBeNull();
  });

  it("fires onRetry and onBack exactly once each", () => {
    const onRetry = jest.fn();
    const onBack = jest.fn();
    renderUI(<ErrorState onRetry={onRetry} onBack={onBack} />);

    fireEvent.press(screen.getByText("إعادة المحاولة"));
    fireEvent.press(screen.getByText("العودة"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("honours custom button labels", () => {
    renderUI(
      <ErrorState onRetry={jest.fn()} onBack={jest.fn()} retryLabel="حاول" backLabel="رجوع" />,
    );
    expect(screen.getByText("حاول")).toBeTruthy();
    expect(screen.getByText("رجوع")).toBeTruthy();
    expect(screen.queryByText("إعادة المحاولة")).toBeNull();
  });

  // `common.retry`, `common.goBack`, `common.errorMessage` and the whole
  // `error.404.*` group used to be missing from i18n/en.json, so i18next fell
  // through to the hard-coded Arabic default passed as t()'s second argument —
  // an English user saw an Arabic retry button under an English "Error" title.
  it("localizes the retry button when the app language is English", () => {
    renderUI(<ErrorState onRetry={jest.fn()} onBack={jest.fn()} />, { lang: "en" });
    expect(screen.getByText("Error")).toBeTruthy();
    expect(screen.queryByText("إعادة المحاولة")).toBeNull();
    expect(screen.queryByText("العودة")).toBeNull();
  });

  // Same missing-key fallout on the copy itself — the 404 title/message and
  // the generic error message used to render in Arabic inside the English UI.
  it("localizes the 404 copy when the app language is English", () => {
    renderUI(<ErrorState type="error404" />, { lang: "en" });
    expect(screen.queryByText("الصفحة غير موجودة")).toBeNull();
    expect(screen.queryByText("نعتذر، لم نجد ما تبحث عنه.")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("StatusModal", () => {
  it("renders nothing while visible is false", () => {
    renderUI(
      <StatusModal visible={false} type="success" title="تم الحجز" onClose={jest.fn()} />,
    );
    expect(screen.queryByText("تم الحجز")).toBeNull();
  });

  it("renders the title and message when visible", () => {
    renderUI(
      <StatusModal visible type="success" title="تم الحجز" message="سيصلك إشعار" onClose={jest.fn()} />,
    );
    expect(screen.getByText("تم الحجز")).toBeTruthy();
    expect(screen.getByText("سيصلك إشعار")).toBeTruthy();
  });

  it("omits title and message rows when they are not provided", () => {
    renderUI(<StatusModal visible type="failed" onClose={jest.fn()} />);
    // Only the default button label is left as text.
    expect(screen.getAllByText(/./)).toHaveLength(1);
    expect(screen.getByText("حسناً")).toBeTruthy();
  });

  it("uses 'حسناً' as the default close-button label and fires onClose once", () => {
    const onClose = jest.fn();
    renderUI(<StatusModal visible type="success" onClose={onClose} />);
    fireEvent.press(screen.getByText("حسناً"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("honours a custom buttonLabel", () => {
    renderUI(<StatusModal visible type="failed" buttonLabel="إغلاق" onClose={jest.fn()} />);
    expect(screen.getByText("إغلاق")).toBeTruthy();
    expect(screen.queryByText("حسناً")).toBeNull();
  });

  it("shows no dismiss button for type='loading', even when onClose is supplied", () => {
    // A loading modal must stay modal — the user cannot dismiss the spinner.
    renderUI(<StatusModal visible type="loading" title="جاري الحجز" onClose={jest.fn()} />);
    expect(screen.getByText("جاري الحجز")).toBeTruthy();
    expect(screen.queryByText("حسناً")).toBeNull();
  });

  it("shows no dismiss button when onClose is omitted", () => {
    renderUI(<StatusModal visible type="error404" title="غير موجود" />);
    expect(screen.getByText("غير موجود")).toBeTruthy();
    expect(screen.queryByText("حسناً")).toBeNull();
  });

  it("keeps rendering after a visible → hidden → visible cycle", () => {
    const { rerender } = renderUI(
      <StatusModal visible type="success" title="تم" onClose={jest.fn()} />,
    );
    expect(screen.getByText("تم")).toBeTruthy();

    rerender(
      <Provider store={makeStore()}>
        <I18nextProvider i18n={arI18n}>
          <StatusModal visible={false} type="success" title="تم" onClose={jest.fn()} />
        </I18nextProvider>
      </Provider>,
    );
    expect(screen.queryByText("تم")).toBeNull();

    rerender(
      <Provider store={makeStore()}>
        <I18nextProvider i18n={arI18n}>
          <StatusModal visible type="success" title="تم" onClose={jest.fn()} />
        </I18nextProvider>
      </Provider>,
    );
    expect(screen.getByText("تم")).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PressableScale", () => {
  it("renders its children", () => {
    renderUI(
      <PressableScale onPress={jest.fn()}>
        <Text>اضغط هنا</Text>
      </PressableScale>,
    );
    expect(screen.getByText("اضغط هنا")).toBeTruthy();
  });

  it("fires onPress once per press", () => {
    const onPress = jest.fn();
    renderUI(
      <PressableScale onPress={onPress}>
        <Text>اضغط</Text>
      </PressableScale>,
    );
    fireEvent.press(screen.getByText("اضغط"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress while disabled (double-submit guard)", () => {
    const onPress = jest.fn();
    renderUI(
      <PressableScale onPress={onPress} disabled>
        <Text>اضغط</Text>
      </PressableScale>,
    );
    fireEvent.press(screen.getByText("اضغط"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("still forwards the caller's onPressIn/onPressOut alongside its own animation", () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    renderUI(
      <PressableScale onPress={jest.fn()} onPressIn={onPressIn} onPressOut={onPressOut} testID="scaler">
        <Text>اضغط</Text>
      </PressableScale>,
    );
    fireEvent(screen.getByTestId("scaler"), "pressIn");
    fireEvent(screen.getByTestId("scaler"), "pressOut");
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it("survives a custom scaleTo of 0 and renders with no press handler at all", () => {
    renderUI(
      <PressableScale scaleTo={0} testID="scaler">
        <Text>بدون معالج</Text>
      </PressableScale>,
    );
    expect(screen.getByText("بدون معالج")).toBeTruthy();
    // Pressing with no onPress must not throw.
    expect(() => fireEvent.press(screen.getByTestId("scaler"))).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Collapsible", () => {
  it("starts collapsed — the children are not mounted", () => {
    renderUI(
      <Collapsible title="الشروط">
        <Text>نص الشروط</Text>
      </Collapsible>,
    );
    expect(screen.getByText("الشروط")).toBeTruthy();
    expect(screen.queryByText("نص الشروط")).toBeNull();
  });

  it("mounts the children on the first press and unmounts them on the second", () => {
    renderUI(
      <Collapsible title="الشروط">
        <Text>نص الشروط</Text>
      </Collapsible>,
    );
    fireEvent.press(screen.getByText("الشروط"));
    expect(screen.getByText("نص الشروط")).toBeTruthy();

    fireEvent.press(screen.getByText("الشروط"));
    expect(screen.queryByText("نص الشروط")).toBeNull();
  });

  it("toggles independently for each instance", () => {
    renderUI(
      <View>
        <Collapsible title="أ">
          <Text>محتوى أ</Text>
        </Collapsible>
        <Collapsible title="ب">
          <Text>محتوى ب</Text>
        </Collapsible>
      </View>,
    );
    fireEvent.press(screen.getByText("أ"));
    expect(screen.getByText("محتوى أ")).toBeTruthy();
    expect(screen.queryByText("محتوى ب")).toBeNull();
  });

  it("renders with an empty title and with no children", () => {
    expect(() => renderUI(<Collapsible title="" />)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("CircleBackButton", () => {
  /** The button has no text; grab its single touchable host. */
  const pressButton = () => {
    const { UNSAFE_getAllByType } = screen;
    const touchable = UNSAFE_getAllByType(
      require("react-native").TouchableOpacity,
    )[0];
    fireEvent.press(touchable);
  };

  it("calls the caller's onPress and never touches the router", () => {
    const onPress = jest.fn();
    renderUI(<CircleBackButton onPress={onPress} />);
    pressButton();

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("goes back through the router when there is history and no onPress", () => {
    mockCanGoBack.mockReturnValue(true);
    renderUI(<CircleBackButton />);
    pressButton();

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("falls back to the owner dashboard when there is no history and the user is an owner", () => {
    mockCanGoBack.mockReturnValue(false);
    renderUI(<CircleBackButton />, { userType: "owner" });
    pressButton();

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(dashboard)/home");
  });

  it("falls back to the customer tabs for a customer, a guest, and a signed-out user", () => {
    for (const userType of ["customer", "guest", null] as UserType[]) {
      mockReplace.mockClear();
      mockCanGoBack.mockReturnValue(false);
      renderUI(<CircleBackButton />, { userType });
      pressButton();
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(customer)");
      screen.unmount();
    }
  });

  it("plays light haptic feedback on every press", () => {
    renderUI(<CircleBackButton onPress={jest.fn()} />);
    pressButton();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it("still navigates when haptics are unavailable and reject", () => {
    (Haptics.impactAsync as jest.Mock).mockReturnValueOnce(
      Promise.reject(new Error("no haptics engine")),
    );
    const onPress = jest.fn();
    renderUI(<CircleBackButton onPress={onPress} />);
    expect(() => pressButton()).not.toThrow();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
