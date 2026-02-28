
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Ticket, Urgency, TicketStatus, Contact } from '../types';
import { Send, User, Building2, Phone, MessageSquare, AlertCircle, Search, CheckCircle2 } from 'lucide-react';

interface RequestFormProps {
  onSubmit: (ticket: Ticket) => void;
  contacts: Contact[];
}

const RequestForm: React.FC<RequestFormProps> = ({ onSubmit, contacts }) => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    phone: '',
    requirement: '',
    urgency: Urgency.MEDIUM,
  });

  const [extSearch, setExtSearch] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // Auto-fill when extension matches
  useEffect(() => {
    if (!extSearch.trim()) {
      setIsAutoFilled(false);
      return;
    }

    const match = contacts.find(c => c.extension === extSearch.trim());
    if (match) {
      // Only trigger auto-fill if the data is actually different
      const isDifferent = 
        formData.name !== match.name || 
        formData.department !== match.department || 
        formData.phone !== match.extension;

      if (isDifferent) {
        setFormData(prev => ({
          ...prev,
          name: match.name,
          department: match.department,
          phone: match.extension
        }));
        setIsAutoFilled(true);
        
        // Use a timer to clear the "success" state, but clear previous timers
        const timer = setTimeout(() => setIsAutoFilled(false), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsAutoFilled(false);
    }
  }, [extSearch, contacts, formData.name, formData.department, formData.phone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.department || !formData.requirement) {
      alert('請填寫所有必要欄位');
      return;
    }

    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      requestTime: Date.now(),
      status: TicketStatus.PENDING,
    };

    onSubmit(newTicket);
    setFormData({
      name: '',
      department: '',
      phone: '',
      requirement: '',
      urgency: Urgency.MEDIUM,
    });
    setExtSearch('');
    alert('需求已成功提交，我們將儘速處理！');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800">填寫維修/技術需求</h3>
        <p className="text-gray-500 mt-2">請輸入分機號碼以快速帶入個人資訊，或手動填寫。</p>
      </div>

      <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <label className="text-sm font-bold text-blue-700 flex items-center gap-2 mb-2">
          <Search className="w-4 h-4" /> 快速帶入 (輸入分機)
        </label>
        <input
          type="text"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-mono ${isAutoFilled ? 'border-green-500 bg-green-50' : 'border-blue-200'}`}
          placeholder="例如：200"
          value={extSearch}
          onChange={(e) => setExtSearch(e.target.value)}
        />
        {isAutoFilled && (
          <p className="text-[10px] text-green-600 mt-2 font-bold animate-pulse flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 已自動帶入聯絡人資料！
          </p>
        )}
        {!isAutoFilled && (
          <p className="text-[10px] text-blue-500 mt-2 font-medium">輸入分機號碼將自動比對通訊錄</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" /> 申請人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="例如：王小明"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> 所屬部門 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="例如：行政課"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4" /> 電話或分機
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="例如：#123"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> 緊急程度
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.urgency}
              onChange={(e) => setFormData({...formData, urgency: e.target.value as Urgency})}
            >
              <option value={Urgency.LOW}>{Urgency.LOW} (一般業務)</option>
              <option value={Urgency.MEDIUM}>{Urgency.MEDIUM} (重要業務)</option>
              <option value={Urgency.HIGH}>{Urgency.HIGH} (急件 / 系統中斷)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> 需求描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="請詳細描述遇到的技術問題，例如：電腦無法開機、印表機卡紙、無法連線網路等。"
            value={formData.requirement}
            onChange={(e) => setFormData({...formData, requirement: e.target.value})}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
        >
          <Send className="w-5 h-5" />
          提交申請單
        </button>
      </form>
    </div>
  );
};

export default RequestForm;
