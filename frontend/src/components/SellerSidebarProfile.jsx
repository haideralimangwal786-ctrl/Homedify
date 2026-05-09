import React, { useContext } from 'react';
import { Button, Tooltip } from 'antd';
import { LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const SellerSidebarProfile = ({ collapsed, seller, avatarPreview }) => {
  const { user, logout } = useContext(AuthContext);

  const getMediaUrl = (pathValue) => {
    if (!pathValue) return 'https://files.catbox.moe/6z7x6v.png';
    const pathStr = String(pathValue).replace(/\\/g, '/');
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    
    if (pathStr.includes('uploads')) {
        const uploadsIndex = pathStr.indexOf('uploads');
        return `${backendUrl}/${pathStr.substring(uploadsIndex)}`;
    }
    
    const normalizedPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
    return `${backendUrl}/uploads${normalizedPath}`;
  };

  const imageSource = avatarPreview || (user?.picture ? getMediaUrl(user.picture) : null);

  return (
    <div className="px-4 py-6 border-t border-gray-50 bg-white shrink-0">
      <div className={`flex items-center gap-4 bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm transition-all duration-300 ${collapsed ? 'justify-center p-2' : ''}`}>
        <div className="w-12 h-12 rounded-full bg-[#FF6B6B] overflow-hidden flex items-center justify-center border-2 border-white shadow-sm shrink-0">
          {imageSource ? (
            <img 
              src={imageSource} 
              alt="Seller" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
            style={{ display: imageSource ? 'none' : 'flex' }}
          >
            {(seller?.storeName || seller?.shopName || user?.name || 'S').charAt(0).toUpperCase()}
          </div>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1E293B] m-0 truncate leading-tight">{seller?.storeName || seller?.shopName || user?.name}</p>
            <p className="text-[9px] font-black text-[#94A3B8] m-0 uppercase tracking-[0.1em] mt-0.5">Store Owner</p>
          </div>
        )}
        {!collapsed && (
          <Tooltip title="Logout">
            <Button 
              type="text" 
              icon={<LogOut size={18} />} 
              onClick={logout}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 transition-all rounded-xl h-10 w-10 flex items-center justify-center"
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default SellerSidebarProfile;
