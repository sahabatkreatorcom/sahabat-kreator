'use client';

import { useState } from 'react';
import {
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
  FileImage,
  FileVideo,
  ArrowUp,
  Search,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: FolderNode[];
  mediaCount: number;
}

interface MediaItem {
  id: string;
  folderId: string | null;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
}

export function MediaFolders() {
  const [folders, setFolders] = useState<FolderNode[]>([
    { id: 'root', name: 'Root', parentId: null, children: [], mediaCount: 0 },
    { id: 'f1', name: 'Feed Posts', parentId: 'root', mediaCount: 12, children: [] },
    { id: 'f2', name: 'Stories', parentId: 'root', mediaCount: 8, children: [] },
    { id: 'f3', name: 'Reels', parentId: 'root', mediaCount: 5, children: [] },
    { id: 'f4', name: 'IG Feed', parentId: 'f1', mediaCount: 7, children: [] },
    { id: 'f5', name: 'FB Feed', parentId: 'f1', mediaCount: 5, children: [] },
  ]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([
    { id: 'm1', folderId: 'f1', url: '/media/p1.jpg', fileName: 'post-1.jpg', mimeType: 'image/jpeg' },
    { id: 'm2', folderId: 'f2', url: '/media/s1.jpg', fileName: 'story-1.jpg', mimeType: 'image/jpeg' },
    { id: 'm3', folderId: 'f3', url: '/media/r1.mp4', fileName: 'reel-1.mp4', mimeType: 'video/mp4' },
    { id: 'm4', folderId: null, url: '/media/u1.jpg', fileName: 'untouched.png', mimeType: 'image/png' },
  ]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState<string | null>('root');
  const [dragOver, setDragOver] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const getChildren = (parentId: string | null) =>
    folders.filter((f) => f.parentId === parentId);

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const mediaId = e.dataTransfer.getData('text/plain');
    if (!mediaId) return;

    setMediaItems((prev) =>
      prev.map((m) => (m.id === mediaId ? { ...m, folderId } : m)),
    );
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId ? { ...f, mediaCount: f.mediaCount + 1 } : f,
      ),
    );
    toast.success('Media dipindahkan');
    setDragOver(null);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Nama folder harus diisi');
      return;
    }
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parentId: newFolderParent }),
      });
      if (!res.ok) throw new Error('Failed');
      setShowCreateModal(false);
      setNewFolderName('');
      toast.success('Folder dibuat');
    } catch {
      toast.error('Gagal membuat folder');
    }
  };

  const renderFolderTree = (parentId: string | null, depth: number = 0) => {
    const children = getChildren(parentId);
    return children.map((folder) => {
      const isExpanded = expandedFolders.has(folder.id);
      const hasChildren = getChildren(folder.id).length > 0;

      return (
        <div key={folder.id}>
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
              selectedFolder === folder.id ? 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]' : 'hover:bg-[var(--bg-tertiary)]',
              dragOver === folder.id && 'bg-[var(--accent-gold)]/20',
            )}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={() => { setSelectedFolder(folder.id); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(folder.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, folder.id)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
              className="p-0.5 rounded hover:bg-[var(--bg-tertiary)]"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )
              ) : (
                <span className="w-3.5" />
              )}
            </button>
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-[var(--accent-gold)]" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            )}
            <span className="flex-1 truncate">{folder.name}</span>
            <span className="text-[var(--text-muted)] text-xs">{folder.mediaCount}</span>
            <button className="p-1 rounded hover:bg-[var(--bg-tertiary)]">
              <MoreHorizontal className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            </button>
          </div>
          {isExpanded && hasChildren && renderFolderTree(folder.id, depth + 1)}
          {isExpanded && (
            <div
              className="min-h-4 rounded-lg"
              onDragOver={(e) => { e.preventDefault(); setDragOver(folder.id + '-drop'); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); handleDrop(e, folder.id); }}
            />
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Folder Media</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Organisir media dalam folder untuk akses yang lebih mudah
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" /> Folder Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Folder Tree */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-[var(--text-muted)]" />
              <Input placeholder="Cari folder..." className="h-9" />
            </div>
            <div className="space-y-0.5">
              {renderFolderTree(null)}
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className="lg:col-span-2">
          <div className="card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-[var(--accent-gold)]" />
                <span className="font-medium">
                  {selectedFolder ? folders.find((f) => f.id === selectedFolder)?.name : 'Semua Media'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUp className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span className="text-[var(--text-muted)] text-xs">Drag media ke folder</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {mediaItems
                .filter((m) => !selectedFolder || m.folderId === selectedFolder)
                .map((media) => (
                  <div
                    key={media.id}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)]"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', media.id)}
                  >
                    <div className="flex h-full items-center justify-center">
                      {media.mimeType.startsWith('image/') ? (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                          <FileImage className="h-6 w-6 text-[var(--text-muted)]" />
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                          <FileVideo className="h-6 w-6 text-[var(--text-muted)]" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 hidden items-end bg-black/60 p-2 group-hover:flex">
                      <p className="truncate text-xs text-white">{media.fileName}</p>
                    </div>
                  </div>
                ))}
            </div>

            {mediaItems.filter((m) => !selectedFolder || m.folderId === selectedFolder).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                <Folder className="mb-2 h-8 w-8 opacity-50" />
                <p className="font-medium">Tidak ada media</p>
                <p className="text-sm">Upload media untuk melihat di sini</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-[var(--bg-primary)] p-6">
            <h2 className="mb-4 font-semibold">Buat Folder Baru</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Nama Folder</label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nama folder..."
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Parent Folder</label>
                <select
                  value={newFolderParent ?? 'root'}
                  onChange={(e) => setNewFolderParent(e.target.value || null)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
                >
                  <option value="root">Root</option>
                  {folders.filter((f) => f.id !== 'root').map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleCreateFolder}>
                Buat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
