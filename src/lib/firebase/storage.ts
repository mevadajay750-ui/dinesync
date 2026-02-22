import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
import { app } from "./config";

let storageInstance: FirebaseStorage | null = null;

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(app);
  }
  return storageInstance;
}

const LOGO_PATH = "organizations/logos";
const MENU_IMAGES_PATH = "menu";

/**
 * Upload organization logo and return public URL.
 * Uses userId in path when org does not exist yet (e.g. during create).
 */
export async function uploadOrganizationLogo(file: File, userId: string): Promise<string> {
  const storage = getFirebaseStorage();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${LOGO_PATH}/${userId}-${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

/**
 * Upload menu item image. Path: menu/{organizationId}/{timestamp}.{ext}
 * Returns public download URL.
 */
export async function uploadMenuItemImage(
  file: File,
  organizationId: string
): Promise<string> {
  const storage = getFirebaseStorage();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${MENU_IMAGES_PATH}/${organizationId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
