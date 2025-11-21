// export interface Permission {
//   id: string; // guid as string
//   name: string; // "Users.List"
//   description?: string;
//   // UI helpers
//   checked?: boolean;
//   group?: string; // e.g. "Users"
//   action?: string; // e.g. "List"
// }


export interface PermissionDto {
id: string;
name: string;
description?: string | null;
}