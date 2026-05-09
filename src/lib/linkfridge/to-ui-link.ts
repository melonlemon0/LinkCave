import type { Link } from "@/types/db";
import type { FridgeLink } from "@/types/linkfridge";

/** Bridge for `EditLinkModal` which still expects legacy `Link` shape. */
export function fridgeLinkToUiLink(l: FridgeLink): Link {
  return {
    id: l.id,
    user_id: "",
    folder_id: "",
    url: l.url,
    title: l.title,
    thumbnail_url: l.thumbnailUrl,
    sort_order: l.sortOrder,
    created_at: new Date(l.createdAt).toISOString(),
  };
}
