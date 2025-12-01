export type CategoryTab = 'regular' | 'results' | 'formats';

export type CategoryType =
  | 'wassce_result'
  | 'bece_result'
  | 'novdec_result'
  | 'large_format'
  | 'regular_format';

export type RegularFormatProperties = 'front_only' | 'front_and_back';

export interface CategoryFormData {
  name: string;
  unitPrice: number;
  description: string;
  categoryType?: CategoryType;
  regularFormatProperties?: RegularFormatProperties;
}

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  unitPrice: number;
  description?: string;
  categoryType?: CategoryType;
  regularFormatProperties?: RegularFormatProperties;
}

