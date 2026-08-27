import {
  activeSection,
  notificationNeedsSection,
  resolveNotificationSection,
} from "@/utils/notification-section";

describe("resolveNotificationSection", () => {
  it("follows the sender over the section the owner is currently in", () => {
    // The whole point: an owner browsing as a tenant taps "حجز جديد لشاليهك".
    expect(resolveNotificationSection("owner", "customer", "provider")).toBe("owner");
  });

  it("sends an owner to the tenant side when the notification is their own booking", () => {
    expect(resolveNotificationSection("customer", "owner", "provider")).toBe("customer");
  });

  it("keeps the reader where they are when the sender said nothing", () => {
    // Payout confirmations and pre-`redirectRole` rows land here.
    expect(resolveNotificationSection(undefined, "owner", "provider")).toBe("owner");
    expect(resolveNotificationSection(undefined, "customer", "provider")).toBe("customer");
    expect(resolveNotificationSection(null, "customer", "customer")).toBe("customer");
  });

  it("never sends a tenant account to the dashboard", () => {
    expect(resolveNotificationSection("owner", "customer", "customer")).toBe("customer");
  });

  it("treats an unknown role as unset", () => {
    expect(resolveNotificationSection("admin", "owner", "provider")).toBe("owner");
  });

  it("resolves to the tenant side for a guest", () => {
    expect(resolveNotificationSection("owner", "guest", null)).toBe("customer");
    expect(resolveNotificationSection(undefined, "guest", null)).toBe("customer");
  });
});

describe("activeSection", () => {
  it("is the `role` filter each notification list sends", () => {
    expect(activeSection("owner")).toBe("owner");
    expect(activeSection("customer")).toBe("customer");
  });

  it("reads a guest and a signed-out user as the tenant side", () => {
    expect(activeSection("guest")).toBe("customer");
    expect(activeSection(null)).toBe("customer");
  });
});

// Every section change a notification triggers is one the user did not ask for,
// so it has to be earned: only the routes that actually gate on the section may
// cause one.
describe("notificationNeedsSection", () => {
  it("moves for a tenant booking — it opens inside the customer tabs", () => {
    expect(notificationNeedsSection("booking", "customer", true)).toBe(true);
  });

  it("does not move for an owner booking — /(dashboard)/booking-details is ungated", () => {
    expect(notificationNeedsSection("booking", "owner", true)).toBe(false);
  });

  it("does not move for a chalet or a review — /chalet-details reads the same either way", () => {
    expect(notificationNeedsSection("chalet", "owner", true)).toBe(false);
    expect(notificationNeedsSection("review", "customer", true)).toBe(false);
  });

  it("moves for a payout — the confirm screen picks its API by section", () => {
    expect(notificationNeedsSection("payout", "owner", true)).toBe(true);
    // No id lands on that section's tab home, which is gated too.
    expect(notificationNeedsSection("payout", "customer", false)).toBe(true);
  });

  it("moves for a wallet notification, which opens the customer profile tab", () => {
    expect(notificationNeedsSection("wallet", "customer", false)).toBe(true);
    expect(notificationNeedsSection("wallet", "owner", false)).toBe(false);
  });

  it("does not move for a notification with nothing to open", () => {
    expect(notificationNeedsSection(undefined, "owner", false)).toBe(false);
    expect(notificationNeedsSection("booking", "customer", false)).toBe(false);
  });
});
