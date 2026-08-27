import authReducer, {
  enterSection,
  logout,
  selectAccountType,
  selectLandingSection,
  setCredentials,
  setLanguage,
  setUserType,
  switchMode,
  updateUser,
} from "@/store/authSlice";

// `chosenByUser` because these fixtures mean "signed in having picked this
// side" — without it the reducer answers with the account's own default, which
// is a different scenario and has its own tests below.
const signIn = (type: string, userType: "owner" | "customer") =>
  authReducer(
    undefined,
    setCredentials({
      user: { id: "u1", type },
      token: "t",
      userType,
      accountType: type === "provider" ? "provider" : "customer",
      chosenByUser: true,
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
        chosenByUser: true,
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

// ── The "owner keeps opening the tenant app" report ─────────────────────────
// The active section is a client value. Before this, the ONLY thing that wrote
// it at sign-in was a toggle that starts on "مستأجر", and nothing ever checked
// it against the account — so a chalet owner who never touched that toggle was
// filed as a tenant and relaunched into the customer app forever.
describe("authSlice — landing section", () => {
  const verify = (
    type: string,
    userType: "owner" | "customer",
    chosenByUser?: boolean,
  ) =>
    authReducer(
      undefined,
      setCredentials({
        user: { id: "u1", type },
        token: "t",
        userType,
        accountType: type === "provider" ? "provider" : "customer",
        chosenByUser,
      }),
    );

  it("puts a provider who never touched the toggle in owner mode", () => {
    const state = verify("provider", "customer");
    expect(state.userType).toBe("owner");
    expect(state.sectionChosen).toBe(false);
    expect(selectLandingSection({ auth: state })).toBe("owner");
  });

  it("still honours a provider who explicitly picked the tenant side", () => {
    const state = verify("provider", "customer", true);
    expect(state.userType).toBe("customer");
    expect(state.sectionChosen).toBe(true);
  });

  it("keeps that explicit choice across a restart", () => {
    // What redux-persist hands back on the next cold start is this very object.
    const rehydrated = verify("provider", "customer", true);
    expect(selectLandingSection({ auth: rehydrated })).toBe("customer");
  });

  it("leaves a plain tenant on the tenant side either way", () => {
    expect(verify("user", "customer").userType).toBe("customer");
    expect(verify("user", "owner").userType).toBe("customer");
  });

  it("sends a provider back to the dashboard after a notification moved them", () => {
    const owner = verify("provider", "customer");
    const moved = authReducer(owner, enterSection("customer"));
    // Where they are right now — the notification's destination.
    expect(moved.userType).toBe("customer");
    // But nothing was chosen, so the next cold start reads the account instead.
    expect(moved.sectionChosen).toBe(false);
    expect(selectLandingSection({ auth: moved })).toBe("owner");
  });

  it("does not treat a deliberate switch as a notification detour", () => {
    const owner = verify("provider", "customer");
    const switched = authReducer(owner, switchMode("customer"));
    expect(switched.sectionChosen).toBe(true);
    expect(selectLandingSection({ auth: switched })).toBe("customer");
  });

  it("reads a session persisted before sectionChosen existed as never chosen", () => {
    const legacy = {
      auth: { ...verify("provider", "customer", true), sectionChosen: undefined as any },
    };
    expect(selectLandingSection(legacy as any)).toBe("owner");
  });

  it("keeps a guest a guest", () => {
    const guest = authReducer(undefined, setUserType("guest"));
    expect(selectLandingSection({ auth: guest })).toBe("guest");
  });

  it("logout clears the choice so the next account starts fresh", () => {
    expect(authReducer(verify("provider", "customer", true), logout()).sectionChosen).toBe(false);
  });
});

describe("authSlice — an owner can only be demoted by the server saying so", () => {
  const owner = () =>
    authReducer(
      undefined,
      setCredentials({
        user: { id: "u1", type: "provider", name: "أبو شاليه" },
        token: "t",
        accountType: "provider",
        userType: "owner",
        chosenByUser: true,
      }),
    );

  it("a payload with no type leaves the owner an owner", () => {
    // PUT /users/profile/image answers with just the new image, for instance.
    const next = authReducer(owner(), updateUser({ image: "https://cdn/a.jpg" }));
    expect(next.accountType).toBe("provider");
    expect(next.userType).toBe("owner");
  });

  it("an envelope-shaped payload leaves the owner an owner", () => {
    const next = authReducer(owner(), updateUser({ data: { id: "u1", type: "provider" } }));
    expect(next.accountType).toBe("provider");
    expect(next.userType).toBe("owner");
  });

  it("an explicit non-provider type still demotes", () => {
    const next = authReducer(owner(), updateUser({ id: "u1", type: "user" }));
    expect(next.accountType).toBe("customer");
    expect(next.userType).toBe("customer");
  });
});

describe("authSlice — setUserType('guest') on a live session", () => {
  it("is refused, so an owner is never stranded in a guest shell", () => {
    const owner = authReducer(
      undefined,
      setCredentials({
        user: { id: "u1", type: "provider" },
        token: "t",
        accountType: "provider",
        userType: "owner",
        chosenByUser: true,
      }),
    );
    const next = authReducer(owner, setUserType("guest"));
    expect(next.userType).toBe("owner");
    expect(next.isAuthenticated).toBe(true);
  });

  it("still marks a signed-out visitor as a guest", () => {
    expect(authReducer(undefined, setUserType("guest")).userType).toBe("guest");
  });
});
