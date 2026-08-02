import { resolveNotificationSection } from "@/utils/notification-section";

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
