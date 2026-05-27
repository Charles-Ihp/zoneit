/** Folder returned by the API */
export interface FolderResponse {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Body for creating a folder */
export interface CreateFolderBody {
  /** Display name for this folder */
  name: string;
}

/** Body for updating a folder */
export interface UpdateFolderBody {
  /** New display name */
  name?: string;
}

/** Body for reordering folders */
export interface ReorderFoldersBody {
  /** Array of folder IDs in their new order */
  folderIds: string[];
}
