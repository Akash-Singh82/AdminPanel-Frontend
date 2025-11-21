import { PermissionDto } from "./permission.model";

export interface RoleListDto {
id: string;
name: string;
description?: string | null;
isActive: boolean;
createdOn?: string | null;
createdBy?: string | null;
}


export interface RoleDto {
name: string;
description?: string | null;
isActive: boolean;
permissionIds: string[];
}


export interface RoleDetailsDto {
id: string;
name: string;
description?: string | null;
isActive: boolean;
permissionIds: string[];
permissions: PermissionDto[];
}