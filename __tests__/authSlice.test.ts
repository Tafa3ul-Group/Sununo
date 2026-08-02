import authReducer, {
  logout,
  selectAccountType,
  setCredentials,
  setLanguage,
  switchMode,
} from "@/store/authSlice";

const signIn = (type: string, userType: "owner" | "customer") =>
  authReducer(
    undefined,
    setCredentials({
      user: { id: "u1", type },
      token: "t",
      userType,
      accountType: type === "provider" ? "provider" : "customer",
    }),
  );

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

describe("authSlice — account identity vs active mode", () => {
  it("a provider signing in as a tenant lands in customer mode", () => {
    const state = signIn("provider", "customer");
    expect(state.userType).toBe("customer");
    expect(state.accountType).toBe("provider");
  });

  it("derives accountType from the server user when a caller omits it", () => {
    const state = authReducer(
      undefined,
      setCredentials({
        user: { id: "u1", type: "provider" },
        token: "t",
        userType: "owner",
      }),
    );
    expect(state.accountType).toBe("provider");
  });

  it("switchMode moves a provider between both sections", () => {
    const asTenant = signIn("provider", "customer");
    const asOwner = authReducer(asTenant, switchMode("owner"));
    expect(asOwner.userType).toBe("owner");
    expect(authReducer(asOwner, switchMode("customer")).userType).toBe("customer");
  });

  it("switchMode refuses owner mode for a plain tenant account", () => {
    const tenant = signIn("user", "customer");
    expect(authReducer(tenant, switchMode("owner")).userType).toBe("customer");
  });

  it("switching modes keeps the identity and the selected chalet", () => {
    const asOwner = signIn("provider", "owner");
    const withChalet = { ...asOwner, selectedChalet: { id: "c1", name: "A", image: null } };
    const next = authReducer(withChalet, switchMode("customer"));
    expect(next.accountType).toBe("provider");
    expect(next.selectedChalet).toEqual({ id: "c1", name: "A", image: null });
  });

  it("logout clears the account identity", () => {
    const state = authReducer(signIn("provider", "owner"), logout());
    expect(state.accountType).toBeNull();
    expect(state.userType).toBeNull();
  });

  it("selectAccountType falls back to the user for sessions persisted before it existed", () => {
    const legacy = {
      auth: { ...signIn("provider", "owner"), accountType: undefined as any },
    };
    expect(selectAccountType(legacy as any)).toBe("provider");
  });

  it("selectAccountType is null when nobody is signed in", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(selectAccountType({ auth: state })).toBeNull();
  });
});
