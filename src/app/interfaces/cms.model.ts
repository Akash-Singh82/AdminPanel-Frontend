export interface CmsDto {
  id: string;
  key: string;
  title: string;
  metaKeyword: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export interface CreateCmsDto {
  key: string;
  title: string;
  metaKeyword: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  isActive: boolean;
}

export interface UpdateCmsDto extends Omit<CreateCmsDto, 'key'> {}


