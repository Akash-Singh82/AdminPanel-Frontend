import { from } from "rxjs";

export interface EmailTemplateListItemDto{
    id:string;
    key:string;
    title:string;
    subject:string;
    fromEmail?:string;
    isActive:boolean; 
}

export interface EmailTemplateDetailsDto {
id: string;
key: string;
title: string;
subject: string;
fromEmail?: string | null;
fromName?: string | null;
isActive: boolean;
isManual: boolean;
body: string;
}

export interface EmailTemplateCreateDto {
key: string;
title: string;
subject: string;
fromEmail?: string | null;
fromName?: string | null;
isActive?: boolean;
isManualMail?: boolean;
body?: string;
}

export interface EmailTemplateEditDto extends EmailTemplateCreateDto {
id: string;
}


export interface EmailTemplateFilters {
pageNumber?: number;
pageSize?: number;
key?: string | null;
title?: string | null;
subject?: string | null;
isActive?: boolean | null;
sortField?:string | null;
sortDirection?: 'asc' | 'desc' | null;
}