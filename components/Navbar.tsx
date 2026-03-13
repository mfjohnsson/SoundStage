'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Plus,
  FolderOpen,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Board } from '@prisma/client';
import { createBoard, updateBoard, deleteBoard } from '@/actions/boards';

interface NavbarProps {
  boards: Board[];
  activeBoard: Board;
}

function setLastBoardCookie(boardId: string) {
  document.cookie = `lastBoardId=${boardId}; path=/; max-age=31536000`;
}

export default function Navbar({ boards, activeBoard }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const switchBoard = (boardId: string) => {
    setOpen(false);
    setLastBoardCookie(boardId);
    router.push(`/?boardId=${boardId}`);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const board = await createBoard(newTitle.trim());
    setNewTitle('');
    setCreating(false);
    router.push(`/?boardId=${board.id}`);
  };

  return (
    <header className='bg-secondary p-6 border-b border-white/5 flex justify-between items-end relative'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-black tracking-tighter uppercase italic'>
          Sound<span className='text-accent italic'>Stage</span>
        </h1>

        {/* Project Switcher */}
        <div className='relative'>
          <button
            onClick={() => setOpen(!open)}
            className='flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-400 hover:text-white transition-colors group'
          >
            <FolderOpen className='w-3 h-3 text-accent' />
            <span>Project // {activeBoard.title}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {open && (
            <>
              {/* Backdrop */}
              <div
                className='fixed inset-0 z-40'
                onClick={() => setOpen(false)}
              />

              <div className='absolute left-0 top-8 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden'>
                <div className='p-2'>
                  <p className='text-[9px] uppercase tracking-widest text-zinc-600 px-3 py-2'>
                    Dina projekt
                  </p>

                  {boards.map((board) => (
                    <div key={board.id} className='group/item relative'>
                      {editingId === board.id ? (
                        <div className='flex gap-1 px-2 py-1'>
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                await updateBoard(board.id, editTitle);
                                setEditingId(null);
                              }
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className='flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-accent'
                          />
                          <button
                            onClick={async () => {
                              await updateBoard(board.id, editTitle);
                              setEditingId(null);
                            }}
                            className='p-1 text-accent hover:bg-accent/10 rounded'
                          >
                            <Check className='w-3 h-3' />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className='p-1 text-zinc-500 hover:bg-white/5 rounded'
                          >
                            <X className='w-3 h-3' />
                          </button>
                        </div>
                      ) : (
                        <div className='flex items-center'>
                          <button
                            onClick={() => switchBoard(board.id)}
                            className={`flex-1 text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
                              board.id === activeBoard.id
                                ? 'bg-accent/10 text-accent'
                                : 'text-zinc-300 hover:bg-white/5'
                            }`}
                          >
                            <span className='truncate'>{board.title}</span>
                          </button>

                          {/* Edit/Delete – visas vid hover */}
                          <div className='hidden group-hover/item:flex items-center gap-0.5 pr-2'>
                            <button
                              onClick={() => {
                                setEditingId(board.id);
                                setEditTitle(board.title);
                              }}
                              className='p-1 text-zinc-500 hover:text-white hover:bg-white/5 rounded'
                            >
                              <Edit2 className='w-3 h-3' />
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Ta bort "${board.title}"?`))
                                  return;
                                await deleteBoard(board.id);
                                if (board.id === activeBoard.id)
                                  router.push('/');
                              }}
                              className='p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded'
                            >
                              <Trash2 className='w-3 h-3' />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className='border-t border-white/5 p-2'>
                  {creating ? (
                    <div className='flex gap-2 px-1'>
                      <input
                        autoFocus
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreate();
                          if (e.key === 'Escape') setCreating(false);
                        }}
                        placeholder='Projektnamn...'
                        className='flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-accent'
                      />
                      <button
                        onClick={handleCreate}
                        className='px-3 py-1.5 bg-accent text-black text-xs font-bold rounded'
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreating(true)}
                      className='w-full flex items-center gap-2 px-3 py-2 text-[10px] text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors'
                    >
                      <Plus className='w-3 h-3' />
                      Nytt projekt
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className='text-[10px] font-mono text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full animate-pulse'>
        • STUDIO ONLINE
      </div>
    </header>
  );
}
