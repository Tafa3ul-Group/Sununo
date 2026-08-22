import { updateUser } from "@/store/authSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

/**
 * Write a fresh `GET /auth/me` result back into the persisted `auth.user`.
 *
 * `auth.user` is what the tab-bar avatar, the drawer and the booking screens
 * read, but only sign-in used to write it — so editing the name or the photo
 * refetched `getMe` and updated the RTK Query cache while every one of those
 * surfaces kept rendering the sign-in snapshot until the next login.
 *
 * Call it from any screen that already queries `getMe`, passing the raw query
 * data. RTK Query hands back the same object reference while nothing changed,
 * so this dispatches only on a real change.
 */
export function useSyncAuthUser(meData: any) {
  const dispatch = useDispatch();
  const user = (meData as any)?.data ?? meData;

  useEffect(() => {
    if (user && typeof user === "object") dispatch(updateUser(user));
  }, [user, dispatch]);
}
