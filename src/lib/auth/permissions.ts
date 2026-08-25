import type { Role } from "@/generated/prisma";

/**
 * Roles are coarse; permissions are fine. Nothing in the app branches on
 * `role === "ADMIN"` directly — every gate asks `can(role, permission)`, so
 * adding a third role later is an edit to this file rather than a codebase sweep.
 */
export type Permission =
  | "product:read"
  | "product:create"
  | "product:update"
  | "product:publish"
  | "product:archive"
  | "product:delete"
  | "category:read"
  | "category:write"
  | "category:delete"
  | "media:upload"
  | "media:delete"
  | "user:read"
  | "user:write"
  | "settings:read"
  | "settings:write"
  | "order:read"
  | "order:write"
  | "audit:read";

/**
 * Confirmed scope: an Editor owns a product's whole lifecycle — create, edit,
 * publish, unpublish, archive. The only thing they cannot do is hard-delete it.
 */
const EDITOR_PERMISSIONS = [
  "product:read",
  "product:create",
  "product:update",
  "product:publish",
  "product:archive",
  "category:read",
  "media:upload",
] as const satisfies readonly Permission[];

const ADMIN_PERMISSIONS = [
  ...EDITOR_PERMISSIONS,
  "product:delete",
  "category:write",
  "category:delete",
  "media:delete",
  "user:read",
  "user:write",
  // Orders carry customer names, phone numbers and home addresses. Kept to
  // ADMIN because the approved brief scoped Editors to the catalogue; move
  // "order:read" into EDITOR_PERMISSIONS if Editors should fulfil orders.
  "order:read",
  "order:write",
  "settings:read",
  "settings:write",
  "audit:read",
] as const satisfies readonly Permission[];

const MATRIX: Record<Role, readonly Permission[]> = {
  ADMIN: ADMIN_PERMISSIONS,
  EDITOR: EDITOR_PERMISSIONS,
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

export function permissionsFor(role: Role): readonly Permission[] {
  return MATRIX[role];
}

/** Human-readable role label for the header badge. */
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  EDITOR: "Editor",
};
