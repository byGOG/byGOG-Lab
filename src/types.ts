/**
 * TypeScript tip tanımları
 * Bu dosya proje genelinde kullanılan tipleri tanımlar
 */

/**
 * Link öğesi
 */
export interface Link {
  /** Link adı */
  name: string;
  /** Link URL'i */
  url: string;
  /** Açıklama */
  description?: string;
  /** İkon dosya yolu */
  icon?: string;
  /** İkon alt metni */
  alt?: string;
  /** Etiketler */
  tags?: string[];
  /** Önerilen mi */
  recommended?: boolean;
  /** Resmi kaynak mı */
  official?: boolean;
  /** Gizli mi */
  hidden?: boolean;
  /** Kopyalanacak komut */
  copyText?: string;
  /** Arama için normalleştirilmiş metin */
  folded?: string;
}

/**
 * Alt kategori
 */
export interface Subcategory {
  /** Alt kategori başlığı */
  title: string;
  /** Alt kategorideki linkler */
  links: Link[];
}

/**
 * Kategori
 */
export interface Category {
  /** Kategori başlığı */
  title: string;
  /** Kategorideki linkler */
  links?: Link[];
  /** Alt kategoriler */
  subcategories?: Subcategory[];
  /** Lazy load için dosya yolu */
  file?: string;
}

/**
 * Links veri yapısı
 */
export interface LinksData {
  /** Tüm kategoriler */
  categories: Category[];
}

/**
 * Links index yapısı
 */
export interface LinksIndex {
  /** Index versiyonu */
  version: number;
  /** Oluşturulma zamanı */
  generatedAt: string;
  /** Kategori listesi */
  categories: Array<{
    title: string;
    file: string;
  }>;
  /** Link -> dosya eşlemesi */
  linkIndex: Record<string, string>;
}

/**
 * Arama girdisi
 */
export interface SearchEntry {
  /** DOM index'i */
  index: number;
  /** Normalleştirilmiş arama metni */
  folded: string;
  /** Link elementi mi */
  isLink: boolean;
  /** Kategori elementi */
  catEl: HTMLElement | null;
  /** Alt kategori elementi */
  subEl: HTMLElement | null;
}

/**
 * Arama durumu
 */
export interface SearchState {
  /** Arama input elementi */
  input: HTMLInputElement;
  /** Durum elementi */
  status: HTMLElement;
  /** Arama motoru */
  engine: SearchEngine | null;
  /** DOM node'ları */
  nodes: HTMLElement[];
  /** Arama verisi */
  dataset: SearchEntry[];
}

/**
 * Arama motoru
 */
export interface SearchEngine {
  /** Aramayı çalıştır */
  run: (query: string) => void;
  /** Kaynakları temizle */
  dispose: () => void;
}

/**
 * Highlight meta verisi
 */
export interface HighlightMeta {
  /** Orijinal sorgu */
  raw: string;
  /** Sorgu var mı */
  hasQuery: boolean;
  /** Highlight regex'i */
  regex: RegExp | null;
}

/**
 * Lazy state
 */
export interface LazyState {
  /** Lazy load entry'leri */
  entries: LazyEntry[];
  /** Dosya -> entry map */
  entryByFile: Map<string, LazyEntry>;
  /** Kategori yükle */
  loadCategory: (entry: LazyEntry) => Promise<void>;
  /** Tüm kategorileri yükle */
  loadAll: () => Promise<void>;
  /** Hepsi yüklendi mi */
  allLoaded: () => boolean;
  /** Yükleme promise'i */
  loadAllPromise: Promise<void> | null;
}

/**
 * Lazy entry
 */
export interface LazyEntry {
  /** Kategori meta verisi */
  meta: {
    title: string;
    file: string;
  };
  /** Kategori card elementi */
  card: HTMLElement;
  /** Index */
  index: number;
  /** Yüklendi mi */
  loaded: boolean;
  /** Yükleniyor mu */
  loading: boolean;
  /** Yükleme promise'i */
  promise: Promise<void> | null;
}

/**
 * Favori değişiklik callback'i
 */
export type FavoritesChangeCallback = (favorites: Set<string>) => void;

/**
 * Favoriler API
 */
export interface FavoritesAPI {
  getFavorites: () => Set<string>;
  isFavorite: (name: string) => boolean;
  addFavorite: (name: string) => boolean;
  removeFavorite: (name: string) => boolean;
  toggleFavorite: (name: string) => boolean;
  onFavoritesChange: (callback: FavoritesChangeCallback) => () => void;
  getDefaultFavorites: () => string[];
  resetToDefaults: () => void;
}
