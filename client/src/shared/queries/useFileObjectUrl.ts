import { useEffect, useState } from "react";
import { filesApi } from "../api/files";

type FileObjectUrlState = {
  data?: string;
  isLoading: boolean;
  error?: unknown;
};

export function useFileObjectUrl(fileAssetId: string | undefined): FileObjectUrlState {
  const [state, setState] = useState<FileObjectUrlState>({ isLoading: false });

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;

    if (!fileAssetId) {
      setState({ isLoading: false });
      return;
    }

    setState({ isLoading: true });

    filesApi
      .getFileContentBlob(fileAssetId)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setState({ data: objectUrl, isLoading: false });
      })
      .catch((error) => {
        if (!cancelled) setState({ isLoading: false, error });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileAssetId]);

  return state;
}
