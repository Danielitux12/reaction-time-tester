export const PROFILE_STORAGE_KEY = "reaction-shooter-profile";
export const MIN_PROFILE_NAME_LENGTH = 2;
export const MAX_PROFILE_NAME_LENGTH = 20;

const PROFILE_NAME_PATTERN = /^[\p{L}\p{N}_ -]+$/u;

export const normalizeProfileName = (value: string) => value.trim().replace(/\s+/g, " ");

export const validateProfileName = (value: string): string | null => {
  const name = normalizeProfileName(value);
  if (name.length < MIN_PROFILE_NAME_LENGTH) return "Escribe al menos 2 caracteres.";
  if (name.length > MAX_PROFILE_NAME_LENGTH) return "Usa como máximo 20 caracteres.";
  if (!PROFILE_NAME_PATTERN.test(name)) return "Usa solo letras, números, espacios, guiones o _.";
  return null;
};
