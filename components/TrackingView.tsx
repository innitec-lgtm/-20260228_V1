
import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, Urgency, Engineer } from '../types';
// Added missing PlusCircle icon to imports
import { Search, History, Clock, CheckCircle2, User, Building2, ChevronRight, FileSearch, ArrowRight, PlusCircle, PenTool } from 'lucide-react';
import TicketDetailModal from './TicketDetailModal';

interface TrackingViewProps {
  tickets: Ticket[];
  onUpdate: (ticket: Ticket) => void;
  engineers: Engineer[];
}

const TrackingView: React.FC<TrackingViewProps> = ({ tickets, onUpdate, engineers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const filteredTickets = useMemo(() => {
    return tickets
      .filter(t => {
        const matchesSearch = 
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          t.department.toLowerCase().includes(searchTerm.toLowerCase()) || 
          t.phone.includes(searchTerm) ||
          t.id.includes(searchTerm);
        
        const matchesStatus = activeOnly ? t.status !== TicketStatus.COMPLETED : true;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.requestTime - a.requestTime);
  }, [tickets, searchTerm, activeOnly]);

  const getStatusStep = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.PENDING: return 1;
      case TicketStatus.IN_PROGRESS: return 2;
      case TicketStatus.COMPLETED: return 3;
      default: return 1;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileSearch className="w-6 h-6 text-blue-600" />
              報修案進度查詢
            </h3>
            <p className="text-sm text-gray-500 mt-1">您可以輸入姓名、部門、電話或工單編號查詢</p>
          </div>
          <div className="flex items-center gap-4">
             <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={activeOnly} 
                 onChange={(e) => setActiveOnly(e.target.checked)}
                 className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
               />
               僅顯示處理中
             </label>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜尋您的報修紀錄..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredTickets.map(ticket => (
          <div 
            key={ticket.id} 
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-blue-200 transition-all group cursor-pointer"
            onClick={() => setSelectedTicket(ticket)}
          >
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                   <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase">#{ticket.id}</span>
                   <h4 className="font-bold text-slate-800">{ticket.requirement.substring(0, 50)}{ticket.requirement.length > 50 ? '...' : ''}</h4>
                   {ticket.signature && (
                     <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100 font-bold">
                       <PenTool className="w-3 h-3" /> 已簽署
                     </span>
                   )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ticket.name}</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {ticket.department}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.requestTime).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                 <div className="flex items-center gap-1">
                    <div className={`w-20 h-1.5 rounded-full overflow-hidden bg-gray-100 flex`}>
                      <div className={`h-full transition-all duration-500 ${getStatusStep(ticket.status) >= 1 ? 'bg-blue-400' : 'bg-gray-100'} w-1/3`}></div>
                      <div className={`h-full transition-all duration-500 ${getStatusStep(ticket.status) >= 2 ? 'bg-blue-500' : 'bg-gray-100'} w-1/3`}></div>
                      <div className={`h-full transition-all duration-500 ${getStatusStep(ticket.status) >= 3 ? 'bg-green-500' : 'bg-gray-100'} w-1/3`}></div>
                    </div>
                    <span className={`text-xs font-bold ${ticket.status === TicketStatus.COMPLETED ? 'text-green-600' : 'text-blue-600'}`}>
                      {ticket.status}
                    </span>
                 </div>
                 {ticket.assignedEngineer && (
                   <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                     負責人: {ticket.assignedEngineer}
                   </span>
                 )}
              </div>
            </div>

            {/* Timeline Detail (Visible when searched or group active) */}
            <div className="px-5 py-4 bg-slate-50 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">提出報修</p>
                  <p className="text-[10px] text-slate-500">{new Date(ticket.requestTime).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full ${getStatusStep(ticket.status) >= 2 ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-400'} flex items-center justify-center shrink-0 mt-0.5 transition-colors`}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">分派/處理中</p>
                  <p className="text-[10px] text-slate-500">
                    {ticket.assignedEngineer ? `已分派給 ${ticket.assignedEngineer}` : '等候分派中'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full ${getStatusStep(ticket.status) === 3 ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-400'} flex items-center justify-center shrink-0 mt-0.5 transition-colors`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">案件結案</p>
                  <p className="text-[10px] text-slate-500">
                    {ticket.completionTime ? new Date(ticket.completionTime).toLocaleString() : '尚未完結'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">沒有符合搜尋條件的報修紀錄</p>
            <button 
              onClick={() => {setSearchTerm(''); setActiveOnly(false)}}
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              清除所有過濾條件
            </button>
          </div>
        )}
      </div>

      {selectedTicket && (
        <TicketDetailModal 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          onUpdate={(t) => {
            onUpdate(t);
            setSelectedTicket(null);
          }}
          engineers={engineers}
        />
      )}
    </div>
  );
};

export default TrackingView;
