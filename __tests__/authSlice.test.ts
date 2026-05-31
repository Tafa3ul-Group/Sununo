import authReducer, { setLanguage } from "@/store/authSlice";

describe("authSlice — language", () => {
  it("defaults to Arabic", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state.language).toBe("ar");
  });

  it("setLanguage switches to English", () => {
    const state = authReducer(undefined, setLanguage("en"));
    expect(state.language).toBe("en");
  });

  it("setLanguage switches back to Arabic", () => {
    const en = authReducer(undefined, setLanguage("en"));
    const ar = authReducer(en, setLanguage("ar"));
    expect(ar.language).toBe("ar");
  });

  it("does not touch unrelated fields", () => {
    const initial = authReducer(undefined, { type: "@@INIT" });
    const next = authReducer(initial, setLanguage("en"));
    expect(next.isAuthenticated).toBe(initial.isAuthenticated);
    expect(next.userType).toBe(initial.userType);
    expect(next.token).toBe(initial.token);
  });
});
