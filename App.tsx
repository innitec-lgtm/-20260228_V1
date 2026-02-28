
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ClipboardList, 
  PlusCircle, 
  BarChart3, 
  Settings, 
  Clock, 
  LayoutDashboard,
  Wifi,
  RefreshCw,
  BellRing,
  Smartphone,
  Share2,
  Search,
  History,
  BookOpen
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { Ticket, Urgency, TicketStatus, Engineer, AppView, Contact } from './types';
import { DEFAULT_CONTACTS, DEFAULT_ENGINEERS } from './constants';
import RequestForm from './components/RequestForm';
import TicketList from './components/TicketList';
import ReportSection from './components/ReportSection';
import EngineerManagement from './components/EngineerManagement';
import ContactManagement from './components/ContactManagement';
import ShareModal from './components/ShareModal';
import TrackingView from './components/TrackingView';

const ApiService = {
  fetchTickets: async (): Promise<Ticket[]> => {
    const res = await fetch('/api/tickets');
    return res.json();
  },
  saveTicket: async (ticket: Ticket): Promise<void> => {
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
  },
  updateTicket: async (updatedTicket: Ticket): Promise<void> => {
    await fetch(`/api/tickets/${updatedTicket.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTicket)
    });
  },
  deleteTicket: async (id: string): Promise<void> => {
    await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
  },
  fetchEngineers: async (): Promise<Engineer[]> => {
    const res = await fetch('/api/engineers');
    return res.json();
  },
  saveEngineers: async (engineers: Engineer[]): Promise<void> => {
    await fetch('/api/engineers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(engineers)
    });
  },
  fetchContacts: async (): Promise<Contact[]> => {
    const res = await fetch('/api/contacts');
    return res.json();
  },
  saveContacts: async (contacts: Contact[]): Promise<void> => {
    await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contacts)
    });
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('pending');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [appConfig, setAppConfig] = useState<{appUrl: string, sharedAppUrl: string, version: string} | null>(null);
  const [manualSyncing, setManualSyncing] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const previousTicketsCount = useRef<number>(0);

  const syncTickets = useCallback(async (showLoading = false) => {
    if (showLoading) setIsSyncing(true);
    try {
      const remoteTickets = await ApiService.fetchTickets();
      if (remoteTickets.length > previousTicketsCount.current && previousTicketsCount.current !== 0) {
        const newTickets = remoteTickets.slice(previousTicketsCount.current);
        const hasHighUrgency = newTickets.some(t => t.urgency === Urgency.HIGH);
        if (Notification.permission === 'granted') {
          new Notification(hasHighUrgency ? '⚠️ 緊急叫修提醒' : '新技術支援需求', {
            body: `${newTickets[0].name} 提交了新需求: ${newTickets[0].requirement.substring(0, 20)}...`,
          });
        }
      }
      setTickets(remoteTickets);
      previousTicketsCount.current = remoteTickets.length;
      setLastSync(new Date());
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      if (showLoading) setTimeout(() => setIsSyncing(false), 500);
    }
  }, []);

  useEffect(() => {
    // Initialize Socket.io with explicit options for proxy environments
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      initFetch();
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error, falling back to polling:', err.message);
      setIsConnected(false);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('tickets:updated', (updatedTickets: Ticket[]) => {
      setTickets(updatedTickets);
      previousTicketsCount.current = updatedTickets.length;
      setLastSync(new Date());
    });

    socket.on('engineers:updated', (updatedEngineers: Engineer[]) => {
      setEngineers(updatedEngineers);
    });

    socket.on('contacts:updated', (updatedContacts: Contact[]) => {
      setContacts(updatedContacts);
    });

    // Initial fetch function
    const initFetch = async () => {
      setIsSyncing(true);
      try {
        const [t, e, c, config] = await Promise.all([
          ApiService.fetchTickets(),
          ApiService.fetchEngineers(),
          ApiService.fetchContacts(),
          fetch('/api/config').then(res => res.json())
        ]);
        setTickets(t);
        setEngineers(e);
        setContacts(c);
        setAppConfig(config);
        previousTicketsCount.current = t.length;
        setLastSync(new Date());
      } catch (err) {
        console.error('Initial fetch failed', err);
      } finally {
        setIsSyncing(false);
      }
    };

    initFetch();

    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  // Polling fallback every 15 seconds in case WebSocket fails
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (!isConnected) {
        console.log('WebSocket not connected, polling for updates...');
        // We can't call initFetch directly here because it's defined inside the other effect
        // So we'll fetch manually or move initFetch out
        ApiService.fetchTickets().then(t => {
          setTickets(t);
          previousTicketsCount.current = t.length;
          setLastSync(new Date());
        }).catch(err => console.error('Polling fetch failed', err));
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [isConnected]);

  const addTicket = async (ticket: Ticket) => {
    await ApiService.saveTicket(ticket);
    setView('pending');
  };

  const updateTicket = async (updatedTicket: Ticket) => {
    await ApiService.updateTicket(updatedTicket);
  };

  const deleteTicket = async (id: string) => {
    if (window.confirm('確定要刪除此工單嗎？')) {
      await ApiService.deleteTicket(id);
    }
  };

  const forceHardRefresh = () => {
    if (window.confirm('這將清除瀏覽器暫存並重新載入頁面，確定嗎？')) {
      // Clear all local storage just in case
      localStorage.clear();
      // Force reload from server
      window.location.reload();
    }
  };

  const handleManualSync = async () => {
    setManualSyncing(true);
    try {
      const [t, e, c] = await Promise.all([
        ApiService.fetchTickets(),
        ApiService.fetchEngineers(),
        ApiService.fetchContacts()
      ]);
      setTickets(t);
      setEngineers(e);
      setContacts(c);
      setLastSync(new Date());
      alert('同步成功！');
    } catch (err) {
      console.error('Manual sync failed', err);
      alert('同步失敗，請檢查網路連線。');
    } finally {
      setManualSyncing(false);
    }
  };

  const updateEngineers = async (newEngineers: Engineer[] | ((prev: Engineer[]) => Engineer[])) => {
    const updated = typeof newEngineers === 'function' ? newEngineers(engineers) : newEngineers;
    setEngineers(updated);
    await ApiService.saveEngineers(updated);
  };

  const updateContacts = async (newContacts: Contact[] | ((prev: Contact[]) => Contact[])) => {
    const updated = typeof newContacts === 'function' ? newContacts(contacts) : newContacts;
    setContacts(updated);
    await ApiService.saveContacts(updated);
  };

  const pendingCount = tickets.filter(t => t.status !== TicketStatus.COMPLETED).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-400" />
            技術支援中心
          </h1>
          <div className="flex flex-col gap-1 mt-2">
             <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">雲端同步模式</p>
             </div>
             {appConfig?.version && (
               <div className="bg-emerald-500 px-2 py-1 rounded border border-emerald-600 inline-block w-fit animate-pulse">
                 <p className="text-[12px] text-white font-mono font-bold">系統版本: {appConfig.version}</p>
               </div>
             )}
          </div>
        </div>
        
        <div className="py-4 px-3 flex flex-col gap-1">
          <button 
            onClick={() => setView('pending')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'pending' ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="font-medium">工單處理</span>
            {pendingCount > 0 && (
              <span className="ml-auto bg-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                {pendingCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setView('request')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'request' ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-medium">新增需求</span>
          </button>

          <button 
            onClick={() => setView('tracking')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'tracking' ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <History className="w-5 h-5" />
            <span className="font-medium">進度與歷史</span>
          </button>
          
          <button 
            onClick={() => setView('reports')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'reports' ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">統計報表</span>
          </button>
          
          <div className="my-4 border-t border-slate-800 mx-4"></div>

          <button 
            onClick={() => setView('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'settings' ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">人員設定</span>
          </button>

          <button 
            onClick={() => setView('contacts')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'contacts' ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">通訊錄管理</span>
          </button>
        </div>

          <div className="mt-auto p-4 bg-slate-950/50 space-y-3">
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
              >
                <Smartphone className="w-4 h-4" />
                手機同步掃描
              </button>
              <button 
                onClick={handleManualSync}
                disabled={manualSyncing}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${manualSyncing ? 'animate-spin' : ''}`} />
                立即手動同步
              </button>
              <button 
                onClick={forceHardRefresh}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-red-900/30 text-[10px] text-slate-500 hover:text-red-400 rounded-lg transition-colors border border-slate-800"
              >
                <RefreshCw className="w-3 h-3" />
                清除暫存並重整
              </button>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
                  <span className={isConnected ? 'text-green-500 font-bold' : 'text-red-500'}>{isConnected ? '已連線' : '連線中...'}</span>
                </div>
                {appConfig?.version && <span className="text-[12px] text-emerald-400 font-bold">VER: {appConfig.version} (STABLE)</span>}
              </div>
              <div className="text-right">
                <p>最後更新</p>
                <p>{lastSync.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">
              {view === 'pending' && '待處理工單清單'}
              {view === 'request' && '填寫支援需求'}
              {view === 'reports' && '績效統計報表'}
              {view === 'settings' && '後台人員管理'}
              {view === 'tracking' && '進度查詢與歷史紀錄'}
              {view === 'contacts' && '單位通訊錄管理'}
            </h2>
            {isSyncing && (
              <span className="flex items-center gap-1 text-xs text-blue-500 font-medium animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                正在同步...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
               <Wifi className="w-3 h-3" />
               ONLINE
             </div>
             <button 
               onClick={() => setIsShareModalOpen(true)}
               className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
             >
               <Share2 className="w-4 h-4" />
               <span className="hidden lg:inline">分享網址</span>
             </button>
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
               IT
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {view === 'request' && (
            <RequestForm onSubmit={addTicket} contacts={contacts} />
          )}
          
          {view === 'pending' && (
            <TicketList 
              tickets={tickets} 
              onUpdate={updateTicket} 
              onDelete={deleteTicket}
              engineers={engineers}
            />
          )}

          {view === 'tracking' && (
            <TrackingView 
              tickets={tickets} 
              onUpdate={updateTicket}
              engineers={engineers}
            />
          )}
          
          {view === 'reports' && (
            <ReportSection tickets={tickets} />
          )}

          {view === 'settings' && (
            <EngineerManagement engineers={engineers} setEngineers={updateEngineers} />
          )}

          {view === 'contacts' && (
            <ContactManagement contacts={contacts} setContacts={updateContacts} />
          )}
        </div>
      </main>

      {isShareModalOpen && (
        <ShareModal 
          onClose={() => setIsShareModalOpen(false)} 
          sharedUrl={appConfig?.sharedAppUrl}
        />
      )}
    </div>
  );
};

export default App;
