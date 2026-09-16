import React, { useState } from 'react';
import { ArrowLeft, Star, Clock, MapPin, Edit, ShieldCheck, Plus, Check, Trash2 } from 'lucide-react';
import { FoodShop, MenuItem } from '../../types';

interface ShopkeeperProfileScreenProps {
  shop: FoodShop;
  onBack: () => void;
  onUpdateShop: (updatedShop: FoodShop) => void;
}

export const ShopkeeperProfileScreen: React.FC<ShopkeeperProfileScreenProps> = ({
  shop,
  onBack,
  onUpdateShop
}) => {
  const [isEditingTiming, setIsEditingTiming] = useState(false);
  const [openingTime, setOpeningTime] = useState(shop.openingTime);
  const [closingTime, setClosingTime] = useState(shop.closingTime);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(shop.menuItems);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const handleSaveTiming = () => {
    setIsEditingTiming(false);
    onUpdateShop({
      ...shop,
      openingTime,
      closingTime,
      menuItems
    });
  };

  const handleAddMenuItem = () => {
    if (!newItemName || !newItemPrice) return;
    const newItem: MenuItem = {
      id: 'm-' + Date.now(),
      name: newItemName,
      price: newItemPrice.startsWith('₹') ? newItemPrice : `₹${newItemPrice}`,
      isVeg: true,
      category: 'Specials'
    };
    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    onUpdateShop({ ...shop, menuItems: updated });
    setNewItemName('');
    setNewItemPrice('');
    setShowAddItem(false);
  };

  const handleRemoveMenuItem = (id: string) => {
    const updated = menuItems.filter((m) => m.id !== id);
    setMenuItems(updated);
    onUpdateShop({ ...shop, menuItems: updated });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] text-slate-900 overflow-y-auto select-none pb-12">
      {/* Top Bar */}
      <div className="bg-white px-4 py-3.5 border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Shopkeeper Stall Profile
        </h2>
        <div className="w-9"></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stall Banner & Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="h-36 relative bg-slate-900">
            <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-orange-500 text-white">
                Live Public Listing
              </span>
              <h3 className="text-base font-extrabold tracking-tight mt-1">{shop.name}</h3>
              <p className="text-xs text-slate-200">{shop.category}</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin size={15} className="text-orange-500 flex-shrink-0" />
              <span>{shop.address}</span>
            </div>

            {/* Ratings Triple: Customer, Hygiene, Food Quality */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer</span>
                <span className="text-sm font-black text-slate-900">⭐ {shop.rating}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Hygiene</span>
                <span className="text-sm font-black text-orange-600">🛡️ {shop.hygieneRating}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Food</span>
                <span className="text-sm font-black text-amber-600">🍴 {shop.foodQualityRating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Timing Editor */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-orange-500" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Operating Hours
              </h4>
            </div>
            <button
              onClick={() => {
                if (isEditingTiming) handleSaveTiming();
                else setIsEditingTiming(true);
              }}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              {isEditingTiming ? 'Save Changes' : 'Update Timing'}
            </button>
          </div>

          {isEditingTiming ? (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input
                type="text"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
              />
              <input
                type="text"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-700">
              Open daily from <span className="text-orange-700 font-bold">{openingTime}</span> to{' '}
              <span className="text-orange-700 font-bold">{closingTime}</span>
            </p>
          )}
        </div>

        {/* Menu Manager Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Manage Menu Items
            </h4>
            <button
              onClick={() => setShowAddItem(!showAddItem)}
              className="py-1 px-2.5 rounded-lg bg-amber-50 text-orange-700 border border-amber-200 text-xs font-bold flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Add Item</span>
            </button>
          </div>

          {showAddItem && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 space-y-2 animate-fade-in">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Dish Name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="col-span-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
                <input
                  type="text"
                  placeholder="₹ Price"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="col-span-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
              <button
                onClick={handleAddMenuItem}
                className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-bold"
              >
                Confirm Add
              </button>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {menuItems.map((item) => (
              <div key={item.id} className="py-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{item.name}</span>
                  <span className="text-[10px] text-slate-400">{item.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-900">{item.price}</span>
                  <button
                    onClick={() => handleRemoveMenuItem(item.id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
