
import React, { useState } from 'react';
import { Engineer } from '../types';
import { UserPlus, UserMinus, UserCheck, ShieldCheck, User, Trash2 } from 'lucide-react';

interface EngineerManagementProps {
  engineers: Engineer[];
  setEngineers: React.Dispatch<React.SetStateAction<Engineer[]>>;
}

const EngineerManagement: React.FC<EngineerManagementProps> = ({ engineers, setEngineers }) => {
  const [newName, setNewName] = useState('');

  const addEngineer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    const newEng: Engineer = {
      id: Date.now().toString(),
      name: newName.trim(),
      isDefault: engineers.length === 0 // First one is default by default
    };
    
    setEngineers(prev => [...prev, newEng]);
    setNewName('');
  };

  const removeEngineer = (id: string) => {
    // We remove the confirm to ensure immediate response, as requested by user
    setEngineers(prev => {
      const filtered = prev.filter(e => e.id !== id);
      // If we deleted the default one, pick a new default if possible
      const wasDefault = prev.find(e => e.id === id)?.isDefault;
      if (wasDefault && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const setDefaultEngineer = (id: string) => {
    setEngineers(prev => prev.map(e => ({
      ...e,
      isDefault: e.id === id
    })));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-green-600" />
          支援同仁管理
        </h3>
        <p className="text-sm text-gray-500 mb-6">設定可用於工單指派的完修同仁清單。您可以設定一位「預設人員」，系統將自動為新處理的工單帶入該人員。</p>

        <form onSubmit={addEngineer} className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="輸入新同仁姓名"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            新增人員
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {engineers.map(engineer => (
            <div key={engineer.id} className={`p-4 border rounded-xl flex items-center justify-between group transition-all ${engineer.isDefault ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setDefaultEngineer(engineer.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${engineer.isDefault ? 'bg-blue-600 border-blue-600 shadow-md' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                  title={engineer.isDefault ? "目前為預設人員" : "設為預設人員"}
                >
                  <UserCheck className={`w-5 h-5 ${engineer.isDefault ? 'text-white' : 'text-slate-400'}`} />
                </button>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700">{engineer.name}</span>
                  {engineer.isDefault && <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">預設人員</span>}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeEngineer(engineer.id);
                }}
                className="text-red-400 hover:text-red-600 p-2 transition-all"
                title="移除人員"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EngineerManagement;
