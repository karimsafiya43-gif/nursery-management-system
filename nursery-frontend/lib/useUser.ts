
"use client";

import { useEffect, useState } from "react";
import { getUser, User } from "./api";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const updateUser = () => setUser(getUser());

    updateUser();
    window.addEventListener("storage", updateUser);
    window.addEventListener("role-change", updateUser);

    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("role-change", updateUser);
    };
  }, []);

  return user;
}

