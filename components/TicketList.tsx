
import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, TicketStatus, Urgency, Engineer } from '../types';
// Added missing Building2 icon to imports
import { Clock, CheckCircle2, MoreHorizontal, User, AlertTriangle, ChevronRight, Search, Filter, Trash2, Building2, PenTool } from 'lucide-react';
import TicketDetailModal from './TicketDetailModal';

interface TicketListProps {
  tickets: Ticket[];
  onUpdate: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
  engineers: Engineer[];
}

const TicketList: React.FC<TicketListProps> = ({ tickets, onUpdate, onDelete, engineers }) => {
  const [now, setNow] = useState(Date.now());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<Urgency | 'ALL'>('ALL');

  // Update "time elapsed" every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const sortedTickets = useMemo(() => {
    return [...tickets]
      .filter(t => {
        const matchesSearch = t.name.includes(searchTerm) || t.requirement.includes(searchTerm) || t.department.includes(searchTerm);
        const matchesUrgency = filterUrgency === 'ALL' || t.urgency === filterUrgency;
        return matchesSearch && matchesUrgency;
      })
      .sort((a, b) => {
        // First handle completion: Completed tickets at bottom
        if (a.status === TicketStatus.COMPLETED && b.status !== TicketStatus.COMPLETED) return 1;
        if (a.status !== TicketStatus.COMPLETED && b.status === TicketStatus.COMPLETED) return -1;
        
        // Then Priority (High first)
        const priorityScore = { [Urgency.HIGH]: 3, [Urgency.MEDIUM]: 2, [Urgency.LOW]: 1 };
        if (priorityScore[a.urgency] !== priorityScore[b.urgency]) {
          return priorityScore[b.urgency] - priorityScore[a.urgency];
        }
        
        // Then Request Time (Oldest first - FCFS)
        return a.requestTime - b.requestTime;
      });
  }, [tickets, searchTerm, filterUrgency]);

  const formatElapsedTime = (timestamp: number) => {
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60) ;
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小時前`;
    if (mins <= 0) return `剛才`;
    return `${mins}分鐘前`;
  };

  const getUrgencyBadge = (urgency: Urgency) => {
    switch (urgency) {
      case Urgency.HIGH:
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">緊急</span>;
      case Urgency.MEDIUM:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">中等</span>;
      case Urgency.LOW:
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">一般</span>;
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.PENDING:
        return <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase">等待中</span>;
      case TicketStatus.IN_PROGRESS:
        return <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full uppercase">處理中</span>;
      case TicketStatus.COMPLETED:
        return <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full uppercase">已完修</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜尋申請人、部門或內容..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value as Urgency | 'ALL')}
          >
            <option value="ALL">全部緊急度</option>
            <option value={Urgency.HIGH}>僅看緊急</option>
            <option value={Urgency.MEDIUM}>僅看中等</option>
            <option value={Urgency.LOW}>僅看一般</option>
          </select>
        </div>
      </div>

      {/* Ticket Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">工單狀態 / 緊急度</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">申請人 / 部門</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">需求內容摘要</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">離叫修時間</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedTickets.map((ticket) => (
              <tr 
                key={ticket.id} 
                className={`hover:bg-gray-50 transition-colors group cursor-pointer ${ticket.status === TicketStatus.COMPLETED ? 'opacity-60 grayscale-[0.3]' : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    {getStatusBadge(ticket.status)}
                    {getUrgencyBadge(ticket.urgency)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {ticket.name}
                    {ticket.signature && (
                      <PenTool className="w-3 h-3 text-green-600" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3" /> {ticket.department}
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.requirement}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className={`w-4 h-4 ${ticket.urgency === Urgency.HIGH && ticket.status !== TicketStatus.COMPLETED ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                    {ticket.status === TicketStatus.COMPLETED ? (
                       <span className="text-green-600 font-medium">處理完成</span>
                    ) : (
                       <span className={ticket.urgency === Urgency.HIGH ? 'text-red-600 font-bold' : ''}>
                         {formatElapsedTime(ticket.requestTime)}
                       </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(ticket.requestTime).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button 
                      className="p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
                      title="檢視並編輯"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(ticket.id);
                      }}
                      className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-400 opacity-0 group-hover:opacity-100"
                      title="刪除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedTickets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                  目前沒有任何符合條件的工單。
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

export default TicketList;
