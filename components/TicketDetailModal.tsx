
import React, { useState, useRef } from 'react';
import { Ticket, TicketStatus, Urgency, Engineer } from '../types';
import { X, User, Clock, CheckCircle2, Save, FileText, UserPlus, Phone, PenTool, Eraser } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: (ticket: Ticket) => void;
  engineers: Engineer[];
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose, onUpdate, engineers }) => {
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [processNote, setProcessNote] = useState(ticket.processNote || '');
  const [assignedEngineer, setAssignedEngineer] = useState(() => {
    if (ticket.assignedEngineer) return ticket.assignedEngineer;
    const defaultEng = engineers.find(e => e.isDefault);
    return defaultEng ? defaultEng.name : '';
  });
  const sigCanvas = useRef<SignatureCanvas>(null);

  const handleSave = () => {
    let signature = ticket.signature;
    
    if (status === TicketStatus.COMPLETED && sigCanvas.current) {
      if (sigCanvas.current.isEmpty() && !ticket.signature) {
        alert('請在平板上簽名確認以完成工單');
        return;
      }
      if (!sigCanvas.current.isEmpty()) {
        signature = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      }
    }

    const updatedTicket: Ticket = {
      ...ticket,
      status,
      processNote,
      assignedEngineer,
      signature,
      completionTime: status === TicketStatus.COMPLETED ? (ticket.completionTime || Date.now()) : undefined
    };
    onUpdate(updatedTicket);
  };

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              工單詳情
            </h3>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight font-mono">ID: {ticket.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div>
              <label className="text-xs text-blue-600 font-bold uppercase tracking-wider">申請人</label>
              <div className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-1">
                <User className="w-4 h-4" /> {ticket.name}
              </div>
              <div className="text-sm text-slate-600 mt-0.5">{ticket.department}</div>
            </div>
            <div>
              <label className="text-xs text-blue-600 font-bold uppercase tracking-wider">聯繫方式</label>
              <div className="text-sm font-medium text-slate-800 flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4" /> {ticket.phone || '未提供'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                叫修時間：{new Date(ticket.requestTime).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Requirement */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">需求描述</label>
            <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ticket.requirement}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Processing Area */}
          <div className="space-y-6">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              處理記錄與設定
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                   當前狀態
                 </label>
                 <select 
                   className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${status === TicketStatus.COMPLETED ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                   value={status}
                   onChange={(e) => setStatus(e.target.value as TicketStatus)}
                 >
                   <option value={TicketStatus.PENDING}>等待處理</option>
                   <option value={TicketStatus.IN_PROGRESS}>處理中</option>
                   <option value={TicketStatus.COMPLETED}>完修結束</option>
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                   處理人員
                 </label>
                 <div className="relative">
                   <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <select 
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                     value={assignedEngineer}
                     onChange={(e) => setAssignedEngineer(e.target.value)}
                   >
                     <option value="">-- 選擇處理人員 --</option>
                     {engineers.map(eng => (
                       <option key={eng.id} value={eng.name}>{eng.name}</option>
                     ))}
                   </select>
                 </div>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">處理過程紀錄</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="在此輸入處理進度、維修動作、更換零組件等..."
                value={processNote}
                onChange={(e) => setProcessNote(e.target.value)}
              />
            </div>

            {status === TicketStatus.COMPLETED && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-blue-600" />
                  使用者簽名確認 (完修簽收)
                </label>
                
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg overflow-hidden relative">
                  {ticket.signature && !sigCanvas.current?.isEmpty() === false ? (
                    <div className="relative">
                      <img src={ticket.signature} alt="Signature" className="h-40 mx-auto object-contain" />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button 
                          onClick={() => {
                            if(window.confirm('確定要清除現有簽名並重新簽署嗎？')) {
                              onUpdate({...ticket, signature: undefined});
                            }
                          }}
                          className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                          title="清除現有簽名"
                        >
                          <Eraser className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <SignatureCanvas 
                      ref={sigCanvas}
                      penColor="black"
                      canvasProps={{
                        className: "w-full h-40 cursor-crosshair",
                        style: { width: '100%', height: '160px' }
                      }}
                    />
                  )}
                </div>
                
                {!ticket.signature && (
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-gray-500 italic">請在上方區域簽名以完成結案</p>
                    <button 
                      onClick={clearSignature}
                      className="text-xs flex items-center gap-1 text-slate-500 hover:text-red-500 font-medium transition-colors"
                    >
                      <Eraser className="w-3 h-3" /> 清除畫布
                    </button>
                  </div>
                )}
              </div>
            )}

            {ticket.completionTime && status !== TicketStatus.COMPLETED && (
              <div className="text-sm text-green-600 font-semibold bg-green-50 p-3 rounded-lg border border-green-100">
                完修時間：{new Date(ticket.completionTime).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 transition-transform active:scale-95 shadow-md shadow-blue-200"
          >
            <Save className="w-5 h-5" />
            更新工單
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
