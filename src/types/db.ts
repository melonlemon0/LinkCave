export type Folder = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  sort_order: number;
  created_at: string;
};

export type Link = {
  id: string;
  user_id: string;
  folder_id: string;
  url: string;
  title: string;
  thumbnail_url: string | null;
  sort_order: number;
  created_at: string;
};

export type LinkInsert = Omit<Link, "id" | "created_at"> & { id?: string; created_at?: string };
export type FolderInsert = Omit<Folder, "id" | "created_at"> & { id?: string; created_at?: string };
