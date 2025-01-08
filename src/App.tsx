import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { exists } from "@tauri-apps/plugin-fs";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import {
  Trash2,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  File,
  Folder,
  Minus,
  // Square,
  X,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
const appWindow = getCurrentWindow();
function App() {
  const [path, setPath] = useState("");
  const [status, setStatus] = useState("");
  const [selectionType, setSelectionType] = useState<"file" | "folder">(
    "folder"
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const selectPath = async () => {
    try {
      const selected = await open({
        directory: selectionType === "folder",
        multiple: false,
        title: `Select ${selectionType} to delete`,
        filters:
          selectionType === "file"
            ? [
                {
                  name: "All Files",
                  extensions: ["*"],
                },
              ]
            : undefined,
      });

      if (selected) {
        setPath(selected as string);
        setStatus("");
      }
    } catch (error) {
      setStatus("Error selecting path: " + error);
    }
    updateWindowHeight();
  };
  // 在需要调整高度的地方（比如状态更新后）调用这个函数
  const updateWindowHeight = async () => {
    // 获取内容元素的实际高度
    const contentHeight =
    document.getElementById("content")?.scrollHeight || 430;
    const newHeight = Math.min(Math.max(contentHeight, 430), 800);
    await appWindow.setSize(new LogicalSize(446, newHeight));
  };

  const handleDelete = async () => {
    if (!path) {
      setStatus("请先选择文件或文件夹");
      updateWindowHeight();
      return;
    }

    try {
      setIsDeleting(true);
      setStatus("正在删除中...");
      updateWindowHeight();

      const fileExists = await exists(path);
      if (!fileExists) {
        setStatus("路径不存在");
        setIsDeleting(false);
        updateWindowHeight();
        return;
      }

      const isDirectory = selectionType === "folder";

      await invoke("delete_path", {
        path,
        isDirectory,
      })
        .then(() => {
          setStatus("成功删除: " + path);
          setPath("");
        })
        .catch((error) => {
          setStatus("删除错误: " + error);
        })
        .finally(() => {
          setIsDeleting(false);
          updateWindowHeight();
        });
    } catch (error) {
      setStatus("删除错误: " + error);
      setIsDeleting(false);
      updateWindowHeight();
    }
  };

  return (
    <div
      id="content"
      className="h-auto bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-lg overflow-hidden"
    >
      {/* Custom Title Bar */}
      <div
        data-tauri-drag-region
        className="h-10 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 border-b border-white/20 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-gray-600 font-medium">File Killer</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => appWindow.minimize()}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600"
          >
            <Minus size={16} />
          </button>
          {/* <button
            onClick={() => appWindow.toggleMaximize()}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600"
          >
            <Square size={16} />
          </button> */}
          <button
            onClick={() => appWindow.close()}
            className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded-md text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-0 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm shadow-xl p-8 max-w-md w-full border border-white/20">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-2xl">
              <Trash2 size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            File Killer
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Safely delete files and folders
          </p>

          <div className="space-y-6">
            <div className="flex gap-2 p-2 bg-gray-50 rounded-lg">
              <button
                onClick={() => setSelectionType("folder")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectionType === "folder"
                    ? "bg-white shadow text-indigo-600"
                    : "text-gray-600 hover:bg-white/50"
                }`}
              >
                <Folder size={20} />
                Folder
              </button>
              <button
                onClick={() => setSelectionType("file")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectionType === "file"
                    ? "bg-white shadow text-indigo-600"
                    : "text-gray-600 hover:bg-white/50"
                }`}
              >
                <File size={20} />
                File
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={selectPath}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FolderOpen size={20} />
                Select {selectionType}
              </button>

              <button
                onClick={handleDelete}
                disabled={!path || isDeleting}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                  path && !isDeleting
                    ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={20} />
                    Delete
                  </>
                )}
              </button>
            </div>

            {path && (
              <div className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-indigo-100">
                <p className="text-sm text-indigo-600 font-medium mb-1">
                  Selected {selectionType}:
                </p>
                <p className="text-gray-700 font-medium break-all">{path}</p>
              </div>
            )}

            {status && (
              <div
                className={`p-4 rounded-xl flex items-start gap-3 ${
                  status.includes("Error")
                    ? "bg-red-50 text-red-700 border border-red-100"
                    : "bg-green-50 text-green-700 border border-green-100"
                }`}
              >
                {status.includes("Error") ? (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <span>{status}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
