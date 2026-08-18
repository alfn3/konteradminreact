import React, { useState, useEffect } from 'react';
import { Store, Loader2, Plus, Edit, Trash2, MapPin, X, FileSpreadsheet } from 'lucide-react';
import { gasService } from '../services/gas';

const DataKonter = () => {
  const [loading, setLoading] = useState(false);
  const [konterList, setKonterList] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentIndex, setCurrentIndex] = useState(null);
  
  const [formData, setFormData] = useState({
    konter: '',
    alamat: '',
    namaSheet: '',
    warnaKonter: '#3b82f6' // Default blue
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchKonter = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await gasService.call('getDataKonterList');
      if (res.error) {
        setErrorMsg(res.message);
      } else {
        setKonterList(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat data konter');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKonter();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ konter: '', alamat: '', namaSheet: '', warnaKonter: '#3b82f6' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item, index) => {
    setModalMode('edit');
    setCurrentIndex(index);
    setFormData({
      konter: item[0] || '',
      namaSheet: item[1] || '',
      alamat: item[2] || '',
      warnaKonter: item[3] || '#3b82f6'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (index) => {
    if (!confirm('Apakah Anda yakin ingin menghapus konter ini?')) return;
    
    setLoading(true);
    try {
      const res = await gasService.call('hapusKonterList', index);
      if (res.error) throw new Error(res.message);
      fetchKonter();
    } catch (err) {
      alert("Gagal menghapus konter: " + err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let res;
      if (modalMode === 'add') {
        res = await gasService.call('tambahKonterList', formData);
      } else {
        res = await gasService.call('editKonterList', { ...formData, index: currentIndex });
      }
      
      if (res.error) throw new Error(res.message);
      
      setIsModalOpen(false);
      fetchKonter();
    } catch (err) {
      alert("Gagal menyimpan data: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Store className="w-6 h-6 mr-2 text-primary" />
            Data Konter
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola master data konter, Google Sheet ID, dan konfigurasi lokasi.</p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="flex items-center text-sm font-bold bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Konter
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && !isSubmitting ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div className="h-2 w-full bg-slate-200"></div>
                <div className="p-5 flex flex-col h-[180px]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-200 mt-0.5"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <div className="h-8 bg-slate-200 rounded w-full"></div>
                    <div className="h-8 bg-slate-200 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center p-12 text-red-500 text-center">
            <p className="font-semibold mb-2">Terjadi Kesalahan</p>
            <p className="text-sm">{errorMsg}</p>
          </div>
        ) : konterList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
            <FileSpreadsheet className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">Data Kosong</h3>
            <p className="text-sm max-w-sm">Belum ada data konter yang terdaftar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {konterList.map((item, idx) => {
              const [konter, namaSheet, alamat, warnaKonter] = item;
              return (
                <div key={idx} className="bg-white rounded-xl overflow-hidden relative flex flex-col" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  
                  {/* Card header */}
                  <div className="px-5 py-4 flex items-center gap-3 border-b-2" style={{ borderBottomColor: warnaKonter || '#3B82F6', background: 'rgba(248, 250, 252, 0.5)' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ background: warnaKonter || '#3B82F6' }}>
                      {konter ? konter.substring(0, 2).toUpperCase() : 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate" title={konter || '-'}>{konter || '-'}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2" title={alamat || 'Alamat belum diatur'}>{alamat || 'Alamat belum diatur'}</p>
                    </div>
                  </div>

                  {/* Info Sheet */}
                  <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 bg-white flex-1">
                    <div className="px-4 py-3 text-center flex flex-col justify-center">
                      <p className="text-xs text-slate-400 mb-1">Nama Sheet</p>
                      <div>
                        <span className="text-xs font-semibold text-slate-800 font-mono bg-slate-100 rounded px-2 py-0.5">{namaSheet || '-'}</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 text-center flex flex-col justify-center">
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#DCFCE7', color: '#15803D' }}>Aktif</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3 flex items-center justify-end gap-2 bg-slate-50 shrink-0">
                    <button 
                      onClick={() => handleOpenEdit(item, idx)}
                      className="flex items-center text-xs font-medium px-3 py-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(idx)}
                      className="flex items-center text-xs font-medium px-3 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {modalMode === 'add' ? 'Tambah Konter Baru' : 'Edit Data Konter'}
              </h3>
              <button 
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Konter</label>
                <input 
                  type="text" 
                  required
                  value={formData.konter}
                  onChange={(e) => setFormData({...formData, konter: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Contoh: M1 Pagi"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Sheet Konter</label>
                <input 
                  type="text" 
                  required
                  value={formData.namaSheet}
                  onChange={(e) => setFormData({...formData, namaSheet: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Contoh: m1, toko, dll"
                />
                <p className="text-xs text-slate-400 mt-1">Sangat Penting! Nama tab/sheet konter tersebut di file Data Stok.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Konter</label>
                <textarea 
                  rows="2"
                  value={formData.alamat}
                  onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                  placeholder="Jalan / Detail alamat konter"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Warna Konter (Hex Code)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formData.warnaKonter}
                    onChange={(e) => setFormData({...formData, warnaKonter: e.target.value})}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <input 
                    type="text" 
                    value={formData.warnaKonter}
                    onChange={(e) => setFormData({...formData, warnaKonter: e.target.value})}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    'Simpan Data'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataKonter;
