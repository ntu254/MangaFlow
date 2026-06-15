import { ChevronDown, MoreVertical, Paperclip } from 'lucide-react'

const USER_AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&crop=faces"

interface PageWorkspaceRightPanelProps {
  rightTab: 'task' | 'comments';
  setRightTab: (tab: 'task' | 'comments') => void;
}

export function PageWorkspaceRightPanel({ rightTab, setRightTab }: PageWorkspaceRightPanelProps) {
  return (
    <div className="w-80 flex flex-col border-l border-gray-200 shrink-0 bg-white overflow-hidden">
      <div className="flex items-center border-b border-gray-100 shrink-0">
        <button 
          type="button"
          onClick={() => setRightTab('task')}
          className={`flex-1 py-4 text-[13px] font-bold border-b-2 transition-colors ${rightTab === 'task' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
        >
          Task
        </button>
        <button 
          type="button"
          onClick={() => setRightTab('comments')}
          className={`flex-1 py-4 text-[13px] font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${rightTab === 'comments' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
        >
          Comments
          <span className={`text-[10px] px-1.5 rounded-full ${rightTab === 'comments' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>2</span>
        </button>
      </div>

      {rightTab === 'task' ? (
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 shrink-0">
            <h2 className="text-[15px] font-extrabold text-gray-900">Creating task for Region #1</h2>
            <button type="button" aria-label="More options" className="text-gray-400 hover:text-gray-900"><MoreVertical size={16} /></button>
          </div>

          <div className="p-5 flex flex-col gap-6">
            
            {/* Region Preview */}
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-extrabold text-gray-900">Region Preview</span>
              <div className="border border-gray-200 rounded-xl p-3 flex gap-4 bg-gray-50/50">
                <div className="w-20 h-20 bg-white border border-gray-200 rounded shadow-sm overflow-hidden shrink-0 p-1">
                  <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400 text-center leading-tight">Image Crop</div>
                </div>
                <div className="flex flex-col gap-1.5 justify-center">
                  <div className="flex items-center justify-between gap-4"><span className="text-[12px] font-bold text-gray-500">Type</span><span className="text-[12px] font-bold text-gray-900">Bubble (Text)</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-[12px] font-bold text-gray-500">Position</span><span className="text-[12px] font-bold text-gray-900">X: 128, Y: 86</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-[12px] font-bold text-gray-500">Size</span><span className="text-[12px] font-bold text-gray-900">W: 278, H: 142</span></div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full"></div>

            {/* Task Details Form */}
            <div className="flex flex-col gap-4">
              <span className="text-[13px] font-extrabold text-gray-900">Task Details</span>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-600">Task Scope</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button type="button" className="flex-1 py-1.5 bg-white shadow-sm rounded-md text-[12px] font-bold text-gray-900">Region Task</button>
                  <button type="button" className="flex-1 py-1.5 text-[12px] font-bold text-gray-500 hover:text-gray-900">Page-level Task</button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-600">Region Type</label>
                <div className="relative">
                  <select className="w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-[13px] font-bold text-gray-900 outline-none focus:border-purple-500 bg-white shadow-sm cursor-pointer appearance-none">
                    <option>Bubble (Text)</option>
                    <option>SFX</option>
                    <option>Background</option>
                    <option>Character</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-600">Task Title <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Translate SFX, Clean text..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-900 outline-none focus:border-purple-500 bg-white shadow-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-600">Task Type <span className="text-red-500">*</span></label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-900 outline-none focus:border-purple-500 bg-white shadow-sm cursor-pointer">
                    <option>Translation</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-600">Priority</label>
                  <div className="relative">
                    <select className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-[13px] font-bold text-gray-900 outline-none focus:border-purple-500 bg-white shadow-sm cursor-pointer appearance-none">
                      <option>Medium</option>
                    </select>
                    <div className="absolute left-3 top-3 w-2 h-2 rounded-full bg-yellow-500"></div>
                    <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-600">Assign to <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="w-full border border-gray-200 rounded-lg pl-10 pr-8 py-2 text-[13px] font-bold text-gray-900 bg-white shadow-sm flex items-center cursor-pointer">
                    Yuki Tanaka
                  </div>
                  <img src={USER_AVATAR} alt="" className="absolute left-2.5 top-1.5 w-6 h-6 rounded-full object-cover" />
                  <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
                <button type="button" className="text-left text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer mt-1">Browse Production Team</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-600">Due Date</label>
                  <div className="relative">
                    <input type="text" value="May 29, 2024" readOnly className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-[13px] font-bold text-gray-900 bg-white shadow-sm outline-none" />
                    <svg className="absolute left-3 top-2.5 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-600">Base Rate (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">$</span>
                    <input type="text" value="12.00" readOnly className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-[13px] font-bold text-gray-900 bg-white shadow-sm outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[11px] font-bold text-gray-600">Context Pages</label>
                <div className="flex items-center gap-2 mb-1">
                  <button type="button" className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[11px] font-bold text-gray-600 transition-colors">Previous</button>
                  <button type="button" className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[11px] font-bold text-gray-600 transition-colors">Next</button>
                  <button type="button" className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[12px] font-bold transition-colors">Custom</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md text-[11px] font-bold text-gray-700">
                    Page 6 <button type="button" aria-label="Remove page context" className="text-gray-400 hover:text-gray-900"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[11px] font-bold text-gray-600">Reference Files (optional)</label>
                <button type="button" className="flex items-center gap-2 text-[11px] font-bold text-purple-600 bg-white border border-gray-200 hover:border-purple-300 w-fit px-3 py-1.5 rounded-lg shadow-sm transition-colors">
                  <span className="text-lg leading-none mb-0.5">+</span> Attach file
                </button>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[11px] font-bold text-gray-600">Instructions for assistant</label>
                <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm relative">
                  <textarea 
                    aria-label="Instructions for assistant"
                    className="w-full h-[80px] bg-transparent resize-none outline-none text-[13px] text-gray-900" 
                    defaultValue="Translate accurately while keeping the tone serious and urgent."
                  ></textarea>
                  <span className="absolute bottom-2 right-3 text-[10px] font-bold text-gray-400">78 / 1000</span>
                </div>
              </div>

            </div>
          </div>
          
          <div className="p-5 border-t border-gray-100 mt-auto flex items-center justify-between sticky bottom-0 bg-white z-10 shrink-0">
            <button type="button" className="px-3 py-2 text-[13px] font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
            <div className="flex items-center gap-2">
              <button type="button" className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-lg text-[13px] transition-colors shadow-sm">Save Region</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[13px] transition-colors shadow-sm">Create Task</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 p-5 overflow-hidden">
          {/* Comments List */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto mb-4 pr-2">
            <CommentItem 
              author="Kenji Sato (You)" 
              time="May 21, 2024 10:30 AM" 
              text="Please keep the urgency in this line." 
              avatarLetter="M" avatarColor="bg-purple-100 text-purple-700" 
            />
            <CommentItem 
              author="Editor Sarah" 
              time="May 21, 2024 11:02 AM" 
              text="Also check the consistency with page 7." 
              avatarLetter="E" avatarColor="bg-blue-100 text-blue-700" 
            />
          </div>

          {/* Comment Input */}
          <div className="shrink-0 flex flex-col border-t border-gray-100 pt-4">
            <div className="border border-gray-200 rounded-xl bg-gray-50 relative p-3 h-[100px]">
              <textarea 
                aria-label="Add a comment"
                className="w-full h-full bg-transparent resize-none outline-none text-[13px] text-gray-700 placeholder-gray-400" 
                placeholder="Add a comment..."
              ></textarea>
            </div>
            <div className="flex items-center justify-between mt-2">
              <button type="button" aria-label="Attach file" className="p-2 text-gray-400 hover:text-gray-900 rounded transition-colors"><Paperclip size={16}/></button>
              <button type="button" className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[13px] transition-colors shadow-sm">Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CommentItem({ author, time, text, avatarLetter, avatarColor }: any) {
  return (
    <div className="flex gap-4 p-3 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm">
      <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-[13px] font-extrabold shrink-0`}>
        {avatarLetter}
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-gray-900">{author}</span>
            <span className="text-[11px] font-medium text-gray-500">{time}</span>
          </div>
          <button type="button" aria-label="Comment options" className="text-gray-400 hover:text-gray-900"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
        </div>
        <p className="text-[13px] text-gray-700 leading-relaxed font-medium">{text}</p>
      </div>
    </div>
  )
}
