import authReducer, {
  logout,
  selectAccountType,
  setCredentials,
  setLanguage,
  setSelectedChalet,
  setUserType,
} from "@/store/authSlice";

const initial = () => authReducer(undefined, { type: "@@INIT" });

const signIn = (type: string, userType: "owner" | "customer", id = "u1") =>
  authReducer(
    undefined,
    setCredentials({
      user: { id, type },
      token: `token-${id}`,
      userType,
      accountType: type === "provider" ? "provider" : "customer",
    }),
  );

describe("authSlice — setUserType", () => {
  it("moves the active section without touching the account identity", () => {
    const owner = signIn("provider", "owner");
    const next = authReducer(owner, setUserType("customer"));
    expect(next.userType).toBe("customer");
    expect(next.accountType).toBe("provider");
    expect(next.token).toBe("token-u1");
    expect(next.isAuthenticated).toBe(true);
  });

  it("marks a browsing visitor as a guest without signing them in", () => {
    const state = authReducer(initial(), setUserType("guest"));
    expect(state.userType).toBe("guest");
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it("accepts null — the login screen's unset state", () => {
    const guest = authReducer(initial(), setUserType("guest"));
    expect(authReducer(guest, setUserType(null)).userType).toBeNull();
  });

  it("keeps the selected chalet and the language across a section change", () => {
    const owner = authReducer(
      { ...signIn("provider", "owner"), language: "en" as const },
      setSelectedChalet({ id: "c1", name: "شاليه الورد", image: null }),
    );
    const next = authReducer(owner, setUserType("customer"));
    expect(next.selectedChalet).toEqual({
      id: "c1",
      name: "شاليه الورد",
      image: null,
    });
    expect(next.language).toBe("en");
  });

  // The tab layout routes purely off `userType`, so setUserType carries the
  // same authorization weight as switchMode and enforces the same gate.
  it("refuses to put a plain tenant account into owner mode", () => {
    const tenant = signIn("user", "customer");
    expect(authReducer(tenant, setUserType("owner")).userType).toBe("customer");
  });
});

describe("authSlice — setSelectedChalet", () => {
  const chaletA = { id: "c1", name: "شاليه النخيل", image: "https://cdn/a.jpg" };
  const chaletB = { id: "c2", name: "Palm Chalet", image: null };

  it("stores the chalet the owner is managing", () => {
    const state = authReducer(signIn("provider", "owner"), setSelectedChalet(chaletA));
    expect(state.selectedChalet).toEqual(chaletA);
  });

  it("replaces the previous selection wholesale rather than merging it", () => {
    const first = authReducer(signIn("provider", "owner"), setSelectedChalet(chaletA));
    const second = authReducer(first, setSelectedChalet(chaletB));
    expect(second.selectedChalet).toEqual(chaletB);
    expect(second.selectedChalet!.image).toBeNull();
  });

  it("clears the selection when passed null", () => {
    const withChalet = authReducer(signIn("provider", "owner"), setSelectedChalet(chaletA));
    expect(authReducer(withChalet, setSelectedChalet(null)).selectedChalet).toBeNull();
  });

  it("stores a malformed chalet as given — empty strings are not normalized away", () => {
    // The picker feeds this straight from an API row; nothing validates it here.
    const state = authReducer(
      initial(),
      setSelectedChalet({ id: "", name: "", image: null }),
    );
    expect(state.selectedChalet).toEqual({ id: "", name: "", image: null });
  });

  it("does not sign anybody in", () => {
    const state = authReducer(initial(), setSelectedChalet(chaletA));
    expect(state.isAuthenticated).toBe(false);
    expect(state.accountType).toBeNull();
  });
});

describe("authSlice — logout", () => {
  const signedInOwner = () =>
    authReducer(
      signIn("provider", "owner"),
      setSelectedChalet({ id: "c1", name: "شاليه", image: null }),
    );

  it("clears the selected chalet so the next account never sees it", () => {
    expect(authReducer(signedInOwner(), logout()).selectedChalet).toBeNull();
  });

  it("wipes the whole session", () => {
    const state = authReducer(signedInOwner(), logout());
    expect(state).toMatchObject({
      user: null,
      token: null,
      userType: null,
      accountType: null,
      isAuthenticated: false,
      selectedChalet: null,
    });
  });

  it("keeps the chosen language — it is a device preference, not session data", () => {
    const english = authReducer(signedInOwner(), setLanguage("en"));
    expect(authReducer(english, logout()).language).toBe("en");
  });

  it("is idempotent on an already signed-out state", () => {
    const once = authReducer(initial(), logout());
    expect(authReducer(once, logout())).toEqual(once);
  });
});

describe("authSlice — setCredentials over an existing session", () => {
  it("leaves nothing of the previous account behind", () => {
    const accountA = authReducer(
      signIn("provider", "owner", "a1"),
      setSelectedChalet({ id: "c1", name: "شاليه A", image: null }),
    );
    const accountB = authReducer(
      accountA,
      setCredentials({
        user: { id: "b1", type: "customer" },
        token: "token-b1",
        userType: "customer",
      }),
    );

    expect(accountB.user).toEqual({ id: "b1", type: "customer" });
    expect(accountB.token).toBe("token-b1");
    expect(accountB.userType).toBe("customer");
    expect(accountB.accountType).toBe("customer");
  });

  // Account B signing in over A on the same device starts with no chalet, even
  // on a path that skipped logout().
  it("drops the previous account's selected chalet", () => {
    const accountA = authReducer(
      signIn("provider", "owner", "a1"),
      setSelectedChalet({ id: "c1", name: "شاليه A", image: null }),
    );
    const accountB = authReducer(
      accountA,
      setCredentials({
        user: { id: "b1", type: "customer" },
        token: "token-b1",
        userType: "customer",
      }),
    );
    expect(accountB.selectedChalet).toBeNull();
  });

  it("downgrades a provider session to a tenant one when the tenant signs in", () => {
    const owner = signIn("provider", "owner", "a1");
    const tenant = authReducer(
      owner,
      setCredentials({
        user: { id: "b1", type: "user" },
        token: "token-b1",
        userType: "customer",
      }),
    );
    expect(selectAccountType({ auth: tenant })).toBe("customer");
  });

  it("keeps the language across a re-login", () => {
    const english = authReducer(signIn("provider", "owner"), setLanguage("en"));
    const next = authReducer(
      english,
      setCredentials({ user: { id: "b1", type: "customer" }, token: "t", userType: "customer" }),
    );
    expect(next.language).toBe("en");
  });

  it("trusts an explicit accountType over the server user's type", () => {
    // The caller is the login screen, which derives it from the same response —
    // but the payload wins, so a wrong value there is not corrected here.
    const state = authReducer(
      initial(),
      setCredentials({
        user: { id: "u1", type: "user" },
        token: "t",
        userType: "customer",
        accountType: "provider",
      }),
    );
    expect(state.accountType).toBe("provider");
  });
});

describe("authSlice — setCredentials with a malformed payload", () => {
  it("reads a null user as a tenant-less identity", () => {
    // A response missing `user` still flips isAuthenticated — the token is what
    // the api slice sends, and a bad one is bounced by the 401 handler.
    const state = authReducer(
      initial(),
      setCredentials({ user: null, token: "t", userType: "customer" }),
    );
    expect(state.user).toBeNull();
    expect(state.accountType).toBeNull();
    expect(state.isAuthenticated).toBe(true);
  });

  it("treats an unknown user.type as a plain tenant", () => {
    const admin = authReducer(
      initial(),
      setCredentials({ user: { id: "u1", type: "admin" }, token: "t", userType: "customer" }),
    );
    expect(admin.accountType).toBe("customer");

    const typeless = authReducer(
      initial(),
      setCredentials({ user: { id: "u1" }, token: "t", userType: "customer" }),
    );
    expect(typeless.accountType).toBe("customer");
  });

  it("stores an empty token as given", () => {
    const state = authReducer(
      initial(),
      setCredentials({ user: { id: "u1", type: "customer" }, token: "", userType: "customer" }),
    );
    expect(state.token).toBe("");
    expect(state.isAuthenticated).toBe(true);
  });

  it("keeps a very large numeric id and unicode fields intact", () => {
    const user = { id: 9007199254740993, type: "provider", name: "أبو محمد ✅" };
    const state = authReducer(
      initial(),
      setCredentials({ user, token: "t", userType: "owner" }),
    );
    expect(state.user).toEqual(user);
    expect(state.accountType).toBe("provider");
  });
});

describe("selectAccountType — rehydrated legacy sessions", () => {
  it("is null when a legacy session has neither accountType nor a user", () => {
    const legacy = { auth: { ...initial(), accountType: undefined as any, user: null } };
    expect(selectAccountType(legacy as any)).toBeNull();
  });

  it("falls back to the user for a legacy tenant session", () => {
    const legacy = {
      auth: { ...signIn("user", "customer"), accountType: undefined as any },
    };
    expect(selectAccountType(legacy as any)).toBe("customer");
  });

  it("reads a stored null accountType through the same fallback", () => {
    // Persisted sessions can carry an explicit null, not just an absent key.
    const legacy = {
      auth: { ...signIn("provider", "owner"), accountType: null as any },
    };
    expect(selectAccountType(legacy as any)).toBe("provider");
  });

  it("is not fooled by a user object that is an empty object", () => {
    // `{}` is truthy, so the fallback resolves it to a tenant, never a provider.
    const legacy = { auth: { ...initial(), accountType: undefined as any, user: {} } };
    expect(selectAccountType(legacy as any)).toBe("customer");
  });
});
