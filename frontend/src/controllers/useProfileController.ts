import { useCallback, useState } from "react";
import {
  normalizeProfileName,
  PROFILE_STORAGE_KEY,
  validateProfileName,
} from "../shared/profile";

export const useProfileController = () => {
  const [profileName, setProfileName] = useState(() => {
    const savedName = localStorage.getItem(PROFILE_STORAGE_KEY);
    return savedName ? normalizeProfileName(savedName) : "";
  });

  const updateProfileName = useCallback((value: string) => {
    const nextName = normalizeProfileName(value);
    setProfileName(nextName);
    if (validateProfileName(nextName) === null) {
      localStorage.setItem(PROFILE_STORAGE_KEY, nextName);
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }, []);

  return {
    profileName,
    profileError: validateProfileName(profileName),
    updateProfileName,
  };
};
