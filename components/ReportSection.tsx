
import React, { useMemo, useState } from 'react';
import { Ticket, TicketStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { 
  FileDown, CalendarDays, TrendingUp, CheckCircle, BarChart3, Clock, 
  ListChecks, AlertCircle, FileText, Printer, X, Calendar, ChevronDown, Layers, PieChart as PieChartIcon
} from 'lucide-react';

interface ReportSectionProps {
  tickets: Ticket[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const ReportSection: React.FC<ReportSectionProps> = ({ tickets }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  
  // 日期設定
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };
  
  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getYesterdayStr());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());

  const formatFullDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handlePrint = (title: string, elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      alert('找不到報表內容');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert('列印視窗被瀏覽器封鎖，請允許彈出視窗後再試一次。');
      return;
    }

    // 複製目前的樣式與內容
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');
            body { 
              font-family: 'Noto Sans TC', sans-serif; 
              padding: 40px;
              background: white !important;
            }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            .report-header { margin-bottom: 30px; border-bottom: 2px solid #334155; padding-bottom: 20px; }
            .section-title { font-size: 1.25rem; font-weight: bold; margin: 25px 0 15px 0; color: #1e293b; border-left: 4px solid #3b82f6; padding-left: 12px; }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${element.innerHTML}
          </div>
          <script>
            // 等待 Tailwind 加載完成後列印
            window.onload = () => {
              setTimeout(() => {
                window.print();
                // window.close(); // 讓使用者手動關閉，避免某些瀏覽器列印中斷
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString();
    
    const todayCompleted = tickets.filter(t => 
      t.status === TicketStatus.COMPLETED && 
      t.completionTime && 
      new Date(t.completionTime).toLocaleDateString() === todayStr
    ).length;

    const totalCompleted = tickets.filter(t => t.status === TicketStatus.COMPLETED).length;
    const avgResponseTimeMins = tickets
      .filter(t => t.status === TicketStatus.COMPLETED && t.completionTime)
      .reduce((acc, t) => acc + (t.completionTime! - t.requestTime), 0) / (totalCompleted || 1) / 60000;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
      const fullDateStr = d.toLocaleDateString();
      const count = tickets.filter(t => 
        t.status === TicketStatus.COMPLETED && 
        t.completionTime && 
        new Date(t.completionTime).toLocaleDateString() === fullDateStr
      ).length;
      return { name: dateStr, count };
    });

    const urgencyData = [
      { name: '急件', value: tickets.filter(t => t.urgency === '高').length },
      { name: '中等', value: tickets.filter(t => t.urgency === '中').length },
      { name: '一般', value: tickets.filter(t => t.urgency === '低').length },
    ];

    return { todayCompleted, totalCompleted, avgResponseTime: Math.round(avgResponseTimeMins), last7Days, urgencyData };
  }, [tickets]);

  // 日報表資料
  const dailyReportData = useMemo(() => {
    const targetDate = new Date(selectedDate);
    const targetDateStr = targetDate.toLocaleDateString();
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const requests = tickets.filter(t => new Date(t.requestTime).toLocaleDateString() === targetDateStr);
    const completed = tickets.filter(t => 
      t.status === TicketStatus.COMPLETED && 
      t.completionTime && 
      new Date(t.completionTime).toLocaleDateString() === targetDateStr
    );
    const pending = tickets.filter(t => {
      const wasRequested = t.requestTime <= endOfDay.getTime();
      if (!wasRequested) return false;
      const notYetCompleted = t.status !== TicketStatus.COMPLETED;
      const completedLater = t.completionTime && t.completionTime > endOfDay.getTime();
      return notYetCompleted || completedLater;
    });

    return { date: targetDateStr, requests, completed, pending };
  }, [tickets, selectedDate]);

  // 月報表資料
  const monthlyReportData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    
    // 該月份所有案件 (不論何時報修，只要在該月處理中或完成)
    const monthTickets = tickets.filter(t => {
      const d = new Date(t.requestTime);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    const completed = monthTickets.filter(t => t.status === TicketStatus.COMPLETED);
    const pending = monthTickets.filter(t => t.status !== TicketStatus.COMPLETED);
    
    // 部門分佈
    const deptMap: Record<string, number> = {};
    monthTickets.forEach(t => {
      deptMap[t.department] = (deptMap[t.department] || 0) + 1;
    });
    const deptChart = Object.entries(deptMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // 每日案件趨勢 (1~31日)
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const dailyTrend = Array.from({ length: lastDayOfMonth }, (_, i) => {
      const day = i + 1;
      const count = monthTickets.filter(t => new Date(t.requestTime).getDate() === day).length;
      return { name: `${day}日`, count };
    });

    return { 
      yearMonth: `${year}年${month}月`, 
      total: monthTickets.length, 
      completedCount: completed.length, 
      pendingCount: pending.length,
      deptChart,
      dailyTrend,
      allTickets: monthTickets 
    };
  }, [tickets, selectedMonth]);

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">今日完成件數</p>
            <p className="text-3xl font-bold text-gray-800">{stats.todayCompleted}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">累計完成總數</p>
            <p className="text-3xl font-bold text-gray-800">{stats.totalCompleted}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">平均處理分鐘</p>
            <p className="text-3xl font-bold text-gray-800">{stats.avgResponseTime}m</p>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
        <button 
          onClick={() => setActiveTab('daily')}
          className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <Calendar className="w-4 h-4" />
          日報表產生
        </button>
        <button 
          onClick={() => setActiveTab('monthly')}
          className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'monthly' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <Layers className="w-4 h-4" />
          月報表彙整
        </button>
      </div>

      {/* Selection Control Panel */}
      <div className={`${activeTab === 'daily' ? 'bg-blue-900' : 'bg-indigo-900'} rounded-3xl p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl transition-colors duration-500 overflow-hidden relative`}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              height: auto;
              background: white !important;
              color: black !important;
            }
            .no-print { display: none !important; }
          }
        `}} />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2 text-center lg:text-left relative z-10">
          <h3 className="text-2xl font-bold flex items-center justify-center lg:justify-start gap-3">
            {activeTab === 'daily' ? <Calendar className="w-8 h-8 text-blue-300" /> : <Layers className="w-8 h-8 text-indigo-300" />}
            {activeTab === 'daily' ? '每日業務日報表' : '每月績效彙整報表'}
          </h3>
          <p className="text-white/70">
            {activeTab === 'daily' 
              ? '選取指定日期，系統將產出該日的報修詳細紀錄。' 
              : '選取特定月份，系統將彙整該月的報修總量與部門分析。'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/10 relative z-10">
          <div className="relative group w-full sm:w-auto">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none group-focus-within:text-white transition-colors" />
            {activeTab === 'daily' ? (
              <input 
                type="date"
                className="pl-12 pr-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all cursor-pointer font-bold hover:bg-white/20 w-full sm:min-w-[200px] [color-scheme:dark]"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            ) : (
              <input 
                type="month"
                className="pl-12 pr-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all cursor-pointer font-bold hover:bg-white/20 w-full sm:min-w-[200px] [color-scheme:dark]"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            )}
          </div>
          
          <button 
            onClick={() => activeTab === 'daily' ? setShowDailyReport(true) : setShowMonthlyReport(true)}
            className={`px-8 py-3 bg-white ${activeTab === 'daily' ? 'text-blue-900' : 'text-indigo-900'} font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 shrink-0 shadow-lg active:scale-95 whitespace-nowrap`}
          >
            <Printer className="w-5 h-5" />
            產生報表
          </button>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            {activeTab === 'daily' ? '最近七日報修趨勢' : `${monthlyReportData.yearMonth} 每日報修趨勢`}
          </h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeTab === 'daily' ? stats.last7Days : monthlyReportData.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={activeTab === 'daily' ? '#3b82f6' : '#6366f1'} radius={[4, 4, 0, 0]} name="報修件數" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-500" />
            {activeTab === 'daily' ? '工單緊急度比例' : `${monthlyReportData.yearMonth} 各單位報修佔比`}
          </h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeTab === 'daily' ? stats.urgencyData : monthlyReportData.deptChart.slice(0, 7)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(activeTab === 'daily' ? stats.urgencyData : monthlyReportData.deptChart).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Report Modal */}
      {showDailyReport && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
               <div>
                 <h2 className="text-2xl font-black text-slate-800">IT支援中心 業務日報表</h2>
                 <p className="text-slate-500 font-mono text-sm">查詢日期：{dailyReportData.date}</p>
               </div>
               <div className="flex items-center gap-3 no-print">
                 <button 
                   onClick={() => handlePrint(`業務日報表_${dailyReportData.date}`, 'daily-report-content')} 
                   className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                 >
                   <Printer className="w-4 h-4" />
                   列印日報
                 </button>
                 <button onClick={() => setShowDailyReport(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                   <X className="w-6 h-6 text-gray-400" />
                 </button>
               </div>
             </div>
             <div id="daily-report-content" className="flex-1 overflow-y-auto p-8 space-y-12">
                <div className="report-header hidden print:block">
                  <h1 className="text-3xl font-black text-slate-800">IT支援中心 業務日報表</h1>
                  <p className="text-slate-500 font-mono">查詢日期：{dailyReportData.date}</p>
                </div>
                <section>
                  <h3 className="section-title">當日新增叫修 ({dailyReportData.requests.length} 件)</h3>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr><th className="px-4 py-3 text-left">時間</th><th className="px-4 py-3 text-left">單位/人員</th><th className="px-4 py-3 text-left">需求內容</th><th className="px-4 py-3 text-left">緊急度</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {dailyReportData.requests.map(t => (
                          <tr key={t.id}><td className="px-4 py-3">{formatFullDateTime(t.requestTime)}</td><td className="px-4 py-3 font-medium">{t.department} / {t.name}</td><td className="px-4 py-3">{t.requirement}</td><td className="px-4 py-3">{t.urgency}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section>
                  <h3 className="section-title">當日結案清單 ({dailyReportData.completed.length} 件)</h3>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr><th className="px-4 py-3 text-left">完工時間</th><th className="px-4 py-3 text-left">報修人</th><th className="px-4 py-3 text-left">處理摘要</th><th className="px-4 py-3 text-left">承辦人</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {dailyReportData.completed.map(t => (
                          <tr key={t.id}><td className="px-4 py-3">{formatFullDateTime(t.completionTime!)}</td><td className="px-4 py-3 font-medium">{t.name}</td><td className="px-4 py-3">{t.processNote || '完修'}</td><td className="px-4 py-3">{t.assignedEngineer || '無'}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
             </div>
          </div>
        </div>
      )}

      {/* Monthly Report Modal */}
      {showMonthlyReport && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
               <div>
                 <h2 className="text-2xl font-black text-slate-800">IT支援中心 績效月報表</h2>
                 <p className="text-indigo-600 font-mono text-sm font-bold">查詢月份：{monthlyReportData.yearMonth}</p>
               </div>
               <div className="flex items-center gap-3 no-print">
                 <button 
                   onClick={() => handlePrint(`績效月報表_${monthlyReportData.yearMonth}`, 'monthly-report-content')} 
                   className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                 >
                   <Printer className="w-4 h-4" />
                   列印月報
                 </button>
                 <button onClick={() => setShowMonthlyReport(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                   <X className="w-6 h-6 text-gray-400" />
                 </button>
               </div>
             </div>
             <div id="monthly-report-content" className="flex-1 overflow-y-auto p-8 space-y-12">
                <div className="report-header hidden print:block">
                  <h1 className="text-3xl font-black text-slate-800">IT支援中心 績效月報表</h1>
                  <p className="text-indigo-600 font-mono font-bold">查詢月份：{monthlyReportData.yearMonth}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                   <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                      <p className="text-xs text-indigo-500 font-bold mb-1">總收件數</p>
                      <p className="text-3xl font-black text-indigo-800">{monthlyReportData.total}</p>
                   </div>
                   <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
                      <p className="text-xs text-green-600 font-bold mb-1">當月完修</p>
                      <p className="text-3xl font-black text-green-800">{monthlyReportData.completedCount}</p>
                   </div>
                   <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center">
                      <p className="text-xs text-orange-600 font-bold mb-1">未結案件</p>
                      <p className="text-3xl font-black text-orange-800">{monthlyReportData.pendingCount}</p>
                   </div>
                   <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                      <p className="text-xs text-blue-600 font-bold mb-1">達成率</p>
                      <p className="text-3xl font-black text-blue-800">
                        {monthlyReportData.total > 0 ? Math.round((monthlyReportData.completedCount / monthlyReportData.total) * 100) : 0}%
                      </p>
                   </div>
                </div>

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-l-4 border-indigo-500 pl-3">各部門報修分析</h3>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr><th className="px-4 py-3 text-left">部門名稱</th><th className="px-4 py-3 text-center">報修次數</th><th className="px-4 py-3 text-center">佔比</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {monthlyReportData.deptChart.map(dept => (
                          <tr key={dept.name}>
                            <td className="px-4 py-3 font-medium">{dept.name}</td>
                            <td className="px-4 py-3 text-center">{dept.value}</td>
                            <td className="px-4 py-3 text-center text-gray-400">
                              {Math.round((dept.value / monthlyReportData.total) * 100)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSection;
