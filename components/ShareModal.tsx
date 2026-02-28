
import React from 'react';
import { X, Smartphone, Copy, Check, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  onClose: () => void;
  sharedUrl?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ onClose, sharedUrl }) => {
  const [copied, setCopied] = React.useState(false);
  
  // 優先使用 Shared URL，因為 Dev URL 在手機上通常會 404 (權限問題)
  const displayUrl = sharedUrl || window.location.href;
  
  // 使用第三方 API 生成 QR Code 圖片
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(displayUrl)}&margin=10`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-100 relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">手機掃描同步</h3>
          <p className="text-sm text-gray-500 mt-2">請使用手機相機掃描下方 QR Code<br/>即可在手機上開啟此系統</p>
        </div>

        {/* QR Code Body */}
        <div className="p-8 flex flex-col items-center bg-gray-50/50">
          <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100">
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
            />
          </div>
          
          <div className="mt-8 w-full space-y-3">
            <button 
              onClick={copyToClipboard}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700"
            >
              <span className="truncate mr-4 text-xs font-mono">{displayUrl}</span>
              {copied ? <Check className="w-4 h-4 text-green-500 shrink-0" /> : <Copy className="w-4 h-4 text-gray-400 shrink-0" />}
            </button>
            
            <a 
              href={displayUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200"
            >
              <ExternalLink className="w-4 h-4" />
              在新分頁打開
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-blue-50 text-[10px] text-blue-700 text-center leading-relaxed">
          💡 提示：手機掃描請使用「公開分享網址」以避免 404 錯誤。<br/>
          如果出現 Page Not Found，請確保您已在 AI Studio 中將專案設為公開分享。
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
