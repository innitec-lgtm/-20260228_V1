
import React, { useState } from 'react';
import { Contact } from '../types';
import { DEFAULT_CONTACTS } from '../constants';
import { UserPlus, UserMinus, Search, Building2, Phone, User, BookOpen, RotateCcw, Upload, FileText, Edit2, Check, X as CloseIcon, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ContactManagementProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

const ContactManagement: React.FC<ContactManagementProps> = ({ contacts, setContacts }) => {
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newExt, setNewExt] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Contact>>({});

  const resetToDefault = () => {
    console.log('Resetting to default contacts...');
    setContacts(DEFAULT_CONTACTS);
    alert('已重置為預設名單');
  };

  const clearAllContacts = () => {
    console.log('Clearing all contacts...');
    setContacts([]);
    alert('已清空通訊錄');
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDept.trim() || !newExt.trim()) {
      alert('請填寫所有欄位');
      return;
    }
    
    const newContact: Contact = {
      id: uuidv4(),
      name: newName.trim(),
      department: newDept.trim(),
      extension: newExt.trim()
    };
    
    setContacts(prev => [...prev, newContact]);
    setNewName('');
    setNewDept('');
    setNewExt('');
  };

  const handleBulkImport = () => {
    console.log('Starting bulk import...');
    try {
      if (!importText.trim()) {
        alert('請輸入匯入內容');
        return;
      }

      const lines = importText.split('\n').map(l => l.trim()).filter(line => line);
      const newContacts: Contact[] = [];
      let skipCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip header if present
        if (i === 0 && (line.includes('單位') || line.includes('姓名') || line.includes('分機') || line.includes('部門'))) {
          console.log('Skipping header line');
          continue;
        }
        
        // Try multiple delimiters: comma, tab, semicolon, or multiple spaces
        let parts = line.split(/[,\t;]|\s{2,}/).map(p => p.trim()).filter(p => p);
        
        // Fallback: if only 1 part found, try single space
        if (parts.length < 3) {
          const spaceParts = line.split(/\s+/).map(p => p.trim()).filter(p => p);
          if (spaceParts.length >= 3) {
            parts = spaceParts;
          }
        }

        if (parts.length >= 3) {
          newContacts.push({
            id: uuidv4(),
            department: parts[0],
            name: parts[1],
            extension: parts[2]
          });
        } else {
          console.warn(`Line ${i + 1} skipped due to insufficient columns:`, line);
          skipCount++;
        }
      }

      if (newContacts.length === 0) {
        alert('找不到有效的聯絡人資料，請檢查格式是否正確（需包含：單位、姓名、分機）。');
        return;
      }

      const confirmMsg = `偵測到 ${newContacts.length} 筆資料${skipCount > 0 ? ` (跳過 ${skipCount} 筆格式不符)` : ''}。\n確定要匯入並與現有清單合併嗎？`;
      
      if (window.confirm(confirmMsg)) {
        setContacts(prev => {
          const updated = [...prev, ...newContacts];
          console.log('Contacts updated, new total:', updated.length);
          return updated;
        });
        setImportText('');
        setShowImport(false);
        alert(`成功匯入 ${newContacts.length} 筆聯絡人！`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      alert(`匯入失敗: ${error.message}`);
    }
  };

  const startEditing = (contact: Contact) => {
    setEditingId(contact.id);
    setEditData(contact);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setContacts(prev => prev.map(c => c.id === editingId ? { ...c, ...editData } as Contact : c));
    setEditingId(null);
  };

  const removeContact = (id: string) => {
    if (window.confirm('確定要移除此聯絡人嗎？')) {
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.includes(searchTerm) || 
    c.department.includes(searchTerm) || 
    c.extension.includes(searchTerm)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              單位通訊錄管理
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                共 {contacts.length} 筆
              </span>
            </h3>
            <p className="text-sm text-gray-500">維護單位同仁的分機資訊，以便在新增需求時快速帶入資料。</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-blue-200"
            >
              <Upload className="w-4 h-4" />
              大量匯入
            </button>
            <button 
              onClick={resetToDefault}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200"
            >
              <RotateCcw className="w-4 h-4" />
              重置預設
            </button>
            <button 
              onClick={clearAllContacts}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-200"
              title="清空目前清單"
            >
              <UserMinus className="w-4 h-4" />
              清空清單
            </button>
          </div>
        </div>

        {showImport && (
          <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> 大量匯入聯絡人
            </h4>
            <p className="text-xs text-blue-600 mb-4">
              格式說明：每一行代表一筆資料，欄位順序為「部門、姓名、分機」，使用逗號或 Tab 分隔。<br/>
              例如：<br/>
              工務科, 王小明, 201<br/>
              管理科, 李小美, 301
            </p>
            <textarea 
              className="w-full h-40 p-4 bg-white border border-blue-200 rounded-lg font-mono text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請在此貼上通訊錄清單..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowImport(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button 
                onClick={handleBulkImport}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                確認匯入
              </button>
            </div>
          </div>
        )}

        <form onSubmit={addContact} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="部門 (如: 工務科)"
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
            />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="姓名"
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="分機 (如: 200)"
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newExt}
              onChange={(e) => setNewExt(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            新增聯絡人
          </button>
        </form>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="搜尋姓名、部門或分機..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">部門</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">姓名</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">分機</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-4">
                    {editingId === contact.id ? (
                      <input 
                        className="w-full px-2 py-1 border rounded"
                        value={editData.department}
                        onChange={e => setEditData({...editData, department: e.target.value})}
                      />
                    ) : (
                      <span className="font-medium text-slate-700">{contact.department}</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {editingId === contact.id ? (
                      <input 
                        className="w-full px-2 py-1 border rounded"
                        value={editData.name}
                        onChange={e => setEditData({...editData, name: e.target.value})}
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{contact.name}</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {editingId === contact.id ? (
                      <input 
                        className="w-full px-2 py-1 border rounded font-mono"
                        value={editData.extension}
                        onChange={e => setEditData({...editData, extension: e.target.value})}
                      />
                    ) : (
                      <span className="font-mono text-blue-600">{contact.extension}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      {editingId === contact.id ? (
                        <>
                          <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                            <Check className="w-5 h-5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                            <CloseIcon className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => startEditing(contact)}
                            className="text-slate-400 hover:text-blue-600 p-2 transition-opacity"
                            title="編輯"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeContact(contact.id)}
                            className="text-red-400 hover:text-red-600 p-2 transition-opacity"
                            title="刪除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 italic">
                    找不到符合條件的聯絡人
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContactManagement;
