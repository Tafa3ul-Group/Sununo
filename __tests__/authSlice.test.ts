import authReducer, {
  logout,
  selectAccountType,
  setCredentials,
  setLanguage,
  switchMode,
  updateUser,
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

describe("authSlice — updateUser (profile edits reach the persisted user)", () => {
  const signedIn = (extra: Record<string, unknown> = {}) =>
    authReducer(
      undefined,
      setCredentials({
        user: { id: "u1", type: "user", name: "قديم", image: null, ...extra },
        token: "t",
        userType: "customer",
        accountType: "customer",
      }),
    );

  it("writes the edited name and photo over the sign-in snapshot", () => {
    const next = authReducer(
      signedIn(),
      updateUser({ id: "u1", type: "user", name: "جديد", image: "https://cdn/a.jpg" }),
    );
    expect(next.user.name).toBe("جديد");
    expect(next.user.image).toBe("https://cdn/a.jpg");
  });

  it("merges — a key the endpoint omits keeps its known value", () => {
    // PUT /users/profile/image answers with the user entity; other calls carry
    // fields it doesn't, and none of them should be erased by the refresh.
    const next = authReducer(
      signedIn({ phone: "07700000000" }),
      updateUser({ id: "u1", image: "https://cdn/a.jpg" }),
    );
    expect(next.user.phone).toBe("07700000000");
    expect(next.user.name).toBe("قديم");
  });

  it("applies an explicit null — that is the server clearing the field", () => {
    const next = authReducer(
      signedIn({ email: "a@b.c" }),
      updateUser({ id: "u1", email: null }),
    );
    expect(next.user.email).toBeNull();
  });

  it("leaves the session itself alone", () => {
    const next = authReducer(signedIn(), updateUser({ id: "u1", name: "جديد" }));
    expect(next.token).toBe("t");
    expect(next.isAuthenticated).toBe(true);
    expect(next.userType).toBe("customer");
  });

  it("ignores a response that arrives after logout", () => {
    const out = authReducer(signedIn(), logout());
    const next = authReducer(out, updateUser({ id: "u1", name: "جديد" }));
    expect(next.user).toBeNull();
    expect(next.isAuthenticated).toBe(false);
  });

  it("ignores a response belonging to a different account", () => {
    // A getMe still in flight when someone else signs in must not overwrite the
    // new session's user.
    const next = authReducer(signedIn(), updateUser({ id: "u2", name: "شخص آخر" }));
    expect(next.user.id).toBe("u1");
    expect(next.user.name).toBe("قديم");
  });

  it("accepts an id-less payload — it can only have come from this token", () => {
    const next = authReducer(signedIn(), updateUser({ name: "جديد" }));
    expect(next.user.name).toBe("جديد");
    expect(next.user.id).toBe("u1");
  });

  it("ignores an empty payload", () => {
    const before = signedIn();
    expect(authReducer(before, updateUser(null))).toEqual(before);
    expect(authReducer(before, updateUser(undefined))).toEqual(before);
  });

  it("promotes a tenant whose account became a provider, unlocking the switcher", () => {
    const next = authReducer(signedIn(), updateUser({ id: "u1", type: "provider" }));
    expect(next.accountType).toBe("provider");
    expect(authReducer(next, switchMode("owner")).userType).toBe("owner");
  });

  it("drops an owner out of the dashboard when the server says they are no longer a provider", () => {
    const owner = authReducer(
      undefined,
      setCredentials({
        user: { id: "u1", type: "provider" },
        token: "t",
        userType: "owner",
        accountType: "provider",
      }),
    );
    const next = authReducer(owner, updateUser({ id: "u1", type: "user" }));
    expect(next.accountType).toBe("customer");
    expect(next.userType).toBe("customer");
  });

  it("keeps a provider in owner mode across an ordinary profile refresh", () => {
    const owner = authReducer(
      undefined,
      setCredentials({
        user: { id: "u1", type: "provider", name: "قديم" },
        token: "t",
        userType: "owner",
        accountType: "provider",
      }),
    );
    // The image endpoint's payload has no `type`; the merge keeps the old one,
    // so the refresh must not read as a downgrade.
    const next = authReducer(owner, updateUser({ id: "u1", image: "https://cdn/a.jpg" }));
    expect(next.accountType).toBe("provider");
    expect(next.userType).toBe("owner");
  });
});
