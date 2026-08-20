import React, { useState, useEffect } from 'react';
import { Package, Search, Calendar, Store, Plus, FileSpreadsheet, Loader2, RefreshCw, Save, Eye, EyeOff, Edit2, Lock, Unlock } from 'lucide-react';
import { gasService } from '../services/gas';


const DataStok = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState('perdana');
  const [toko, setToko] = useState(''); // Akan di-set setelah fetch konter
  const [konterOptions, setKonterOptions] = useState([]);
  const [storeColors, setStoreColors] = useState({});

  // Tanggal default: Hari ini (YYYY-MM-DD)
  const [tanggal, setTanggal] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [stokData, setStokData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [modifiedStok, setModifiedStok] = useState({});
  const [modifiedPengeluaran, setModifiedPengeluaran] = useState({});
  const [modifiedUang, setModifiedUang] = useState({});
  const [modifiedElektrik, setModifiedElektrik] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState(null);

  const tabs = [
    { id: 'perdana', label: 'Perdana' },
    { id: 'voucher', label: 'Voucher' },
    { id: 'acc', label: 'Aksesoris' },
    { id: 'pengeluaran', label: 'Pengeluaran' },
    { id: 'uang', label: 'Uang' },
    { id: 'elektrik', label: 'Elektrik' },
  ];

  const fetchStok = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Mengirim POST / JSON lewat gasService
      // Perhatikan parameter args harus match dengan apa yang di-handle di `kode.gs`
      const res = await gasService.call('getDataStok', { toko, tanggal });
      if (res.error) {
        setErrorMsg(res.message);
      } else {
        setStokData(res.data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat data stok');
    } finally {
      setLoading(false);
    }
  };

  const fetchKonterOptions = async () => {
    try {
      const res = await gasService.call('getDataKonterList');
      if (!res.error && res.data) {
        // res.data array of rows. [0] is Konter Name, [1] is Nama Sheet, [3] is Warna
        const options = res.data.map(item => ({
          label: item[0] || 'Unknown',
          value: item[1] || item[0] || '' // Gunakan Nama Sheet (col 1), jika kosong gunakan Nama Konter
        }));
        setKonterOptions(options);

        // Build storeColors mapping
        const colors = {};
        res.data.forEach(item => {
          if (item[0]) colors[item[0]] = item[3] || '#3B82F6';
        });
        setStoreColors(colors);

        // Auto select first option if toko is empty
        if (!toko && options.length > 0) {
          setToko(options[0].value);
        }
      }
    } catch (err) {
      console.error("Gagal memuat daftar konter:", err);
    }
  };

  useEffect(() => {
    fetchKonterOptions();
  }, []);

  useEffect(() => {
    if (!toko) return; // Jangan fetch stok jika toko belum terpilih

    setModifiedStok({}); // Reset modified stok saat pindah tanggal/toko
    setModifiedPengeluaran({});
    setModifiedUang({});
    setModifiedElektrik({});
    fetchStok();
  }, [toko, tanggal]);

  const handleStokChange = (item, field, value) => {
    // Hanya allow edit topup dan stokAkhir
    if (field === 'stokAwal') return;
    const realRow = item.realRow;
    setModifiedStok(prev => {
      const tabName = activeTab === 'acc' ? 'Aksesoris' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      const existing = prev[realRow] || {
        row: realRow,
        kategori: tabName,
        produk: `${item.provider || ''}:${item.nama || ''}`.replace(/^:|:$/g, ''),
        topup: item.topup,
        stokAkhir: item.stokAkhir
      };
      return {
        ...prev,
        [realRow]: {
          ...existing,
          [field]: value
        }
      };
    });
  };
  const handlePengeluaranChange = (item, field, value) => {
    const row = item.row;
    setModifiedPengeluaran(prev => {
      const existing = prev[row] || { row, kategori: 'Pengeluaran', produk: item.keterangan || '-', nominal: item.nominal, keterangan: item.keterangan };
      return { ...prev, [row]: { ...existing, [field]: value } };
    });
  };

  const handleUangChange = (item, value) => {
    const row = item.row;
    setModifiedUang(prev => ({
      ...prev,
      [row]: { row, kategori: 'Uang', produk: 'Pecahan', list: value }
    }));
  };

  const handleElektrikChange = (item, field, value) => {
    const row = item.realRow;
    setModifiedElektrik(prev => {
      const existing = prev[row] || { row, kategori: 'Elektrik', produk: item.nama || '-', saldoAwal: item.saldoAwal, topup: item.topup, saldoAkhir: item.saldoAkhir };
      return { ...prev, [row]: { ...existing, [field]: value } };
    });
  };

  const handleBatchSave = async () => {
    // Untuk stok, hanya kirim topup dan stokAkhir (bukan stokAwal), tapi sertakan info log
    const updates = Object.values(modifiedStok).map(item => ({
      row: item.row,
      kategori: item.kategori,
      produk: item.produk,
      topup: item.topup === '' ? '' : item.topup,
      stokAkhir: item.stokAkhir === '' ? '' : item.stokAkhir
    }));
    const updatesPengeluaran = Object.values(modifiedPengeluaran);
    const updatesUang = Object.values(modifiedUang);
    const updatesElektrik = Object.values(modifiedElektrik);

    const totalUpdates = updates.length + updatesPengeluaran.length + updatesUang.length + updatesElektrik.length;
    if (totalUpdates === 0) return;

    setIsSaving(true);
    try {
      const res = await gasService.call('batchUpdateStok', { toko, tanggal, updates, updatesPengeluaran, updatesUang, updatesElektrik });
      if (res.error) throw new Error(res.message);
      // Sukses
      setModifiedStok({});
      setModifiedPengeluaran({});
      setModifiedUang({});
      setModifiedElektrik({});
      fetchStok(); // Refresh data

      if (addToast) {
        addToast(res.message || "Data berhasil disimpan!", "success");
        if (res.syncInfo) {
          setTimeout(() => addToast(res.syncInfo, res.syncInfo.includes("Gagal") || res.syncInfo.includes("Error") ? "error" : "info"), 600);
        }
      } else {
        alert((res.message || "Data berhasil disimpan!") + (res.syncInfo ? "\n\n" + res.syncInfo : ""));
      }
    } catch (err) {
      if (addToast) addToast("Gagal menyimpan data: " + err.message, "error");
      else alert("Gagal menyimpan data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Fungsi helper untuk merender tabel berdasarkan tab
  const renderTableContent = () => {
    if (loading) {
      return (
        <div className="w-full animate-pulse p-4">
          <div className="h-8 bg-slate-200 rounded w-full mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 bg-slate-200 rounded w-12"></div>
                <div className="h-10 bg-slate-200 rounded flex-1"></div>
                <div className="h-10 bg-slate-200 rounded flex-1"></div>
                <div className="h-10 bg-slate-200 rounded w-24"></div>
                <div className="h-10 bg-slate-200 rounded w-24"></div>
                <div className="h-10 bg-slate-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (errorMsg) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-red-500 text-center">
          <p className="font-semibold mb-2">Terjadi Kesalahan</p>
          <p className="text-sm">{errorMsg}</p>
        </div>
      );
    }

    if (!stokData || !stokData[activeTab] || stokData[activeTab].length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
          <FileSpreadsheet className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">Data Kosong</h3>
          <p className="text-sm max-w-sm">
            Tidak ada data {tabs.find(t => t.id === activeTab)?.label} untuk tanggal {tanggal} di toko {toko.toUpperCase()}.
          </p>
        </div>
      );
    }

    // Render Tabel Perdana / Voucher / Aksesoris
    if (['perdana', 'voucher', 'acc'].includes(activeTab)) {
      return (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Provider / Brand</th>
                <th className="px-4 py-3">Nama Produk</th>
                <th className="px-4 py-3 text-center">Awal</th>
                <th className="px-4 py-3 text-center">Topup</th>
                <th className="px-4 py-3 text-center">Akhir</th>
                <th className="px-4 py-3 text-right">Harga</th>
                <th className="px-4 py-3 text-center w-24">Terjual</th>
                <th className="px-4 py-3 text-center w-24 bg-slate-700 text-white border-l border-slate-600 rounded-tr-lg">Gudang</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {stokData[activeTab].filter(item => {
                if (!hideEmpty) return true;
                const mod = modifiedStok[item.realRow];
                const awal = Number(mod?.stokAwal ?? item.stokAwal) || 0;
                const topup = Number(mod?.topup ?? item.topup) || 0;
                const akhir = Number(mod?.stokAkhir ?? item.stokAkhir) || 0;
                return (awal > 0 || topup > 0 || akhir > 0);
              }).map((item, idx, arr) => {
                // Gunakan nilai yang dimodifikasi jika ada
                const mod = modifiedStok[item.realRow];
                const awalVal = mod?.stokAwal ?? item.stokAwal;
                const topupVal = mod?.topup ?? item.topup;
                const akhirVal = mod?.stokAkhir ?? item.stokAkhir;
                const awal = Number(awalVal) || 0;
                const topup = Number(topupVal) || 0;
                const akhir = Number(akhirVal) || 0;
                const terjual = (awal + topup) - akhir;

                // Bersihkan string harga dari karakter non-digit (seperti "Rp", ".", ",")
                let rawHarga = String(item.harga || '0').replace(/[^0-9]/g, '');
                const hargaNum = Number(rawHarga) || 0;

                // Paksa provider jika aksesoris dan masih "-"
                let providerText = item.provider || '-';
                if (activeTab === 'acc' && providerText === '-') {
                  providerText = 'KABEL DATA TOPLES';
                }

                // Cek perubahan provider untuk border separator
                let isProviderChanged = false;
                if (idx > 0) {
                  let prevProvider = arr[idx - 1].provider || '-';
                  if (activeTab === 'acc' && prevProvider === '-') prevProvider = 'KABEL DATA TOPLES';
                  isProviderChanged = providerText !== prevProvider;
                }

                // Fungsi untuk mendapatkan warna badge unik berdasarkan nama provider
                const getProviderBadge = (providerName) => {
                  if (!providerName || providerName === '-') return 'bg-slate-100 text-slate-600';

                  const nameUpper = providerName.toUpperCase();
                  if (nameUpper.includes('TELKOMSEL') || nameUpper.includes('AS') || nameUpper.includes('SIMPATI')) {
                    return 'bg-red-100 text-red-700 font-bold';
                  }
                  if (nameUpper.includes('INDOSAT') || nameUpper.includes('IM3')) {
                    return 'bg-yellow-100 text-yellow-700 font-bold';
                  }
                  if (nameUpper === 'XL' || nameUpper.includes('XL AXIATA')) {
                    return 'bg-blue-100 text-blue-700 font-bold';
                  }
                  if (nameUpper.includes('AXIS')) {
                    return 'bg-purple-100 text-purple-700 font-bold';
                  }
                  if (nameUpper.includes('SMARTFREN')) {
                    return 'bg-pink-100 text-pink-700 font-bold';
                  }
                  if (nameUpper === 'TRI' || nameUpper === 'THREE' || nameUpper === '3' || nameUpper.includes('THREE')) {
                    return 'bg-slate-800 text-white font-bold';
                  }

                  // Simple hash function to generate consistent colors for ACC
                  let hash = 0;
                  for (let i = 0; i < providerName.length; i++) {
                    hash = providerName.charCodeAt(i) + ((hash << 5) - hash);
                  }

                  // Palette warna pastel/modern
                  const colors = [
                    'bg-emerald-100 text-emerald-700',
                    'bg-violet-100 text-violet-700',
                    'bg-amber-100 text-amber-700',
                    'bg-rose-100 text-rose-700',
                    'bg-cyan-100 text-cyan-700',
                    'bg-fuchsia-100 text-fuchsia-700',
                    'bg-orange-100 text-orange-700'
                  ];

                  return colors[Math.abs(hash) % colors.length];
                };

                const badgeClass = getProviderBadge(providerText);

                const renderEditableCell = (field, val, extraClass = '') => {
                  const isEditing = editingCell?.row === item.realRow && editingCell?.field === field;

                  if (isEditing && isEditMode) {
                    return (
                      <div className={`flex items-center justify-center p-1 rounded bg-white shadow-sm ring-1 ring-primary/50 ${extraClass}`}>
                        <input
                          type="number"
                          autoFocus
                          onBlur={() => setEditingCell(null)}
                          className="w-12 text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          onWheel={(e) => e.target.blur()}
                          value={modifiedStok[item.realRow]?.[field] ?? (item[field] === 0 ? '' : (item[field] ?? ''))}
                          onChange={(e) => handleStokChange(item, field, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.target.blur();
                              const currentIndex = arr.findIndex(x => x.realRow === item.realRow);
                              if (currentIndex !== -1 && currentIndex < arr.length - 1) {
                                const nextRow = arr[currentIndex + 1].realRow;
                                setTimeout(() => setEditingCell({ row: nextRow, field }), 10);
                              }
                            }
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      className={`group flex items-center justify-center p-1.5 rounded transition-colors ${isEditMode ? 'cursor-pointer hover:bg-slate-200/50' : ''} ${extraClass}`}
                      onClick={() => isEditMode && setEditingCell({ row: item.realRow, field })}
                      title={isEditMode ? 'Klik untuk edit' : ''}
                    >
                      <span className="min-w-[1.5rem] text-center font-medium">{val}</span>
                      {isEditMode && <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 ml-1.5 transition-opacity" />}
                    </div>
                  );
                };

                const gudangRaw = item.stokGudang === "" ? "" : (Number(item.stokGudang) - topup);
                let gudangTextClass = 'text-slate-800 font-bold';
                let gudangText = gudangRaw;
                if (gudangRaw === "" || gudangRaw === 0) {
                  gudangText = "";
                } else if (gudangRaw < 0) {
                  gudangTextClass = 'text-rose-600 font-bold';
                }

                return (
                  <tr key={idx} className={`hover:bg-slate-50/50 ${isProviderChanged ? 'border-t-2 border-dashed border-slate-300' : ''}`}>
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${badgeClass}`}>
                        {providerText}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.nama}</td>
                    <td className="px-4 py-3 text-center text-slate-500 font-medium">{awalVal}</td>
                    <td className="px-2 py-3">
                      {renderEditableCell('topup', topupVal, (topupVal && Number(topupVal) > 0) ? 'bg-emerald-50 text-emerald-700' : '')}
                    </td>
                    <td className="px-2 py-3">
                      {renderEditableCell('stokAkhir', akhirVal)}
                    </td>
                    <td className="px-4 py-3 text-right">Rp {hargaNum.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-center">
                      {terjual !== 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${terjual > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {terjual}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-center bg-slate-200/70 border-l border-slate-300 shadow-inner ${gudangTextClass}`}>
                      {gudangText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // TAB PENGELUARAN
    if (activeTab === 'pengeluaran') {
      const renderEditablePengeluaran = (item, field, val, isNumber = false) => {
        const isEditing = editingCell?.row === item.row && editingCell?.field === field;
        if (isEditing && isEditMode) {
          let editValue = modifiedPengeluaran[item.row]?.[field] ?? (item[field] || '');
          if (isNumber && typeof editValue === 'string') {
            editValue = editValue.replace(/[^0-9]/g, '');
          }
          return (
            <div className="flex items-center p-1 rounded bg-white shadow-sm ring-1 ring-primary/50 w-full">
              <input
                type={isNumber ? "number" : "text"}
                autoFocus
                onBlur={() => setEditingCell(null)}
                className={`w-full bg-transparent outline-none px-2 ${isNumber ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''}`}
                onWheel={(e) => isNumber && e.target.blur()}
                value={editValue}
                onChange={(e) => handlePengeluaranChange(item, field, e.target.value)}
                onKeyDown={(e) => {
                  if (isNumber && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) e.preventDefault();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                    const arrPeng = stokData.pengeluaran?.filter(i => {
                      if (!hideEmpty) return true;
                      if (editingCell?.row === i.row) return true;
                      const mod = modifiedPengeluaran[i.row];
                      const nom = Number(mod?.nominal ?? i.nominal) || 0;
                      const ket = ((mod?.keterangan ?? i.keterangan) || '').toString().trim();
                      return nom !== 0 || (ket !== '' && ket !== '-');
                    }) || [];
                    const currentIndex = arrPeng.findIndex(x => x.row === item.row);
                    if (currentIndex !== -1 && currentIndex < arrPeng.length - 1) {
                      setTimeout(() => setEditingCell({ row: arrPeng[currentIndex + 1].row, field }), 10);
                    }
                  }
                }}
              />
            </div>
          );
        }

        return (
          <div
            className={`group flex items-center p-1.5 rounded transition-colors min-h-[2.5rem] ${isEditMode ? 'cursor-pointer hover:bg-slate-200/50' : ''}`}
            onClick={() => isEditMode && setEditingCell({ row: item.row, field })}
            title={isEditMode ? "Klik untuk edit" : ""}
          >
            <span className="flex-1">{isNumber && !isNaN(Number(val)) && val !== '' ? `Rp ${Number(val).toLocaleString('id-ID')}` : (val || '-')}</span>
            {isEditMode && <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 ml-2 transition-opacity flex-shrink-0" />}
          </div>
        );
      };

      return (
        <div className="overflow-x-auto w-full p-4">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 w-16">No</th>
                <th className="px-4 py-3 w-48">Nominal</th>
                <th className="px-4 py-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stokData.pengeluaran?.filter(item => {
                if (!hideEmpty) return true;
                if (editingCell?.row === item.row) return true; // Pastikan baris yg sedang diedit tidak tersembunyi
                const mod = modifiedPengeluaran[item.row];
                const nom = Number(mod?.nominal ?? item.nominal) || 0;
                const ket = ((mod?.keterangan ?? item.keterangan) || '').toString().trim();
                return nom !== 0 || (ket !== '' && ket !== '-');
              }).map((item, idx) => {
                const mod = modifiedPengeluaran[item.row];
                const nominal = mod?.nominal ?? item.nominal;
                const keterangan = mod?.keterangan ?? item.keterangan;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-2 py-3 font-semibold text-slate-700">
                      {renderEditablePengeluaran(item, 'nominal', nominal, true)}
                    </td>
                    <td className="px-2 py-3">
                      {renderEditablePengeluaran(item, 'keterangan', keterangan, false)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // TAB ELEKTRIK
    if (activeTab === 'elektrik') {
      const renderEditableElektrik = (item, field, val) => {
        const isEditing = editingCell?.row === item.realRow && editingCell?.field === field;
        if (isEditing && isEditMode) {
          let editValue = modifiedElektrik[item.realRow]?.[field] ?? (item[field] || '');
          if (typeof editValue === 'string') {
            editValue = editValue.replace(/[^0-9]/g, '');
          }
          return (
            <div className="flex items-center p-1 rounded bg-white shadow-sm ring-1 ring-primary/50 w-full justify-center max-w-[120px] mx-auto">
              <input
                type="number"
                autoFocus
                onBlur={() => setEditingCell(null)}
                className="w-full bg-transparent outline-none px-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onWheel={(e) => e.target.blur()}
                value={editValue}
                onChange={(e) => handleElektrikChange(item, field, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                    const arrElektrik = stokData.elektrik || [];
                    const currentIndex = arrElektrik.findIndex(x => x.realRow === item.realRow);
                    if (currentIndex !== -1 && currentIndex < arrElektrik.length - 1) {
                      setTimeout(() => setEditingCell({ row: arrElektrik[currentIndex + 1].realRow, field }), 10);
                    }
                  }
                }}
              />
            </div>
          );
        }

        return (
          <div
            className={`group flex items-center justify-center p-1.5 rounded transition-colors min-h-[2.5rem] ${isEditMode ? 'cursor-pointer hover:bg-slate-200/50' : ''}`}
            onClick={() => isEditMode && setEditingCell({ row: item.realRow, field })}
            title={isEditMode ? "Klik untuk edit" : ""}
          >
            <span>{val || '-'}</span>
            {isEditMode && <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 ml-2 transition-opacity flex-shrink-0" />}
          </div>
        );
      };

      return (
        <div className="overflow-x-auto w-full p-4">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3 text-center">Saldo Awal</th>
                <th className="px-4 py-3 text-center">Topup</th>
                <th className="px-4 py-3 text-center">Saldo Akhir</th>
                <th className="px-4 py-3 text-center font-bold text-primary">Terjual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stokData.elektrik?.map((item, idx) => {
                const mod = modifiedElektrik[item.realRow];
                const awal = mod?.saldoAwal ?? item.saldoAwal;
                const topup = mod?.topup ?? item.topup;
                const akhir = mod?.saldoAkhir ?? item.saldoAkhir;

                const parseNum = (val) => Number(String(val || '0').replace(/[^0-9-]/g, '')) || 0;
                const numAwal = parseNum(awal);
                const numTopup = parseNum(topup);
                const numAkhir = parseNum(akhir);
                const terjual = numAwal + numTopup - numAkhir;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-2 py-3 text-center">{renderEditableElektrik(item, 'saldoAwal', awal)}</td>
                    <td className="px-2 py-3 text-center">{renderEditableElektrik(item, 'topup', topup)}</td>
                    <td className="px-2 py-3 text-center font-semibold text-slate-700">{renderEditableElektrik(item, 'saldoAkhir', akhir)}</td>
                    <td className={`px-4 py-3 text-center font-bold ${terjual < 0 ? 'text-rose-600' : 'text-primary'}`}>
                      {terjual !== 0 ? terjual.toLocaleString('id-ID') : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // TAB UANG (List Ke Bawah & CRUD)
    if (activeTab === 'uang') {
      const renderEditableUang = (item, val) => {
        const isEditing = editingCell?.row === item.row;
        if (isEditing && isEditMode) {
          return (
            <div className="flex items-center p-1 rounded bg-white shadow-sm ring-1 ring-primary/50 w-full max-w-[250px]">
              <input
                type="text"
                autoFocus
                onBlur={() => setEditingCell(null)}
                className="w-full bg-transparent outline-none px-2"
                value={modifiedUang[item.row]?.list ?? (item.list || '')}
                onChange={(e) => handleUangChange(item, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                    const arrUang = stokData.uang || [];
                    const currentIndex = arrUang.findIndex(x => x.row === item.row);
                    if (currentIndex !== -1 && currentIndex < arrUang.length - 1) {
                      setTimeout(() => setEditingCell({ row: arrUang[currentIndex + 1].row, field: 'list' }), 10);
                    }
                  }
                }}
              />
            </div>
          );
        }

        return (
          <div
            className={`group flex items-center p-1.5 rounded transition-colors min-h-[2.5rem] ${isEditMode ? 'cursor-pointer hover:bg-slate-200/50' : ''}`}
            onClick={() => isEditMode && setEditingCell({ row: item.row, field: 'list' })}
            title={isEditMode ? "Klik untuk edit" : ""}
          >
            <span>{val || '-'}</span>
            {isEditMode && <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 ml-2 transition-opacity flex-shrink-0" />}
          </div>
        );
      };

      return (
        <div className="overflow-x-auto w-full p-4">
          <div className="mb-4 max-w-md">
            <h3 className="text-lg font-bold text-slate-800">Rincian Fisik Uang</h3>
            <p className="text-sm text-slate-500">Klik baris nominal untuk mengedit fisik uang.</p>
          </div>
          <table className="w-full text-sm text-left max-w-md">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 w-16">No</th>
                <th className="px-4 py-3">Nominal Uang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stokData.uang?.map((item, idx) => {
                const mod = modifiedUang[item.row];
                const listVal = mod?.list ?? item.list;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-2 py-3 font-semibold text-slate-700">
                      {renderEditableUang(item, listVal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          />
        </div>

        {konterOptions.length === 0 ? (
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
        ) : (
          <select
            value={toko}
            onChange={(e) => setToko(e.target.value)}
            className="text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer transition-colors shadow-sm"
            style={{
              backgroundColor: toko ? (storeColors[konterOptions.find(o => o.value === toko)?.label] || storeColors[toko] || '#3B82F6') : '#3B82F6',
              color: '#fff',
              border: 'none'
            }}
          >
            {konterOptions.map((opt, idx) => (
              <option key={idx} value={opt.value} className="bg-white text-slate-800 font-medium">{opt.label}</option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              setIsEditMode(!isEditMode);
              setEditingCell(null); // Reset mode edit ketika toggle
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isEditMode ? 'bg-primary text-white hover:bg-primary/90' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            {isEditMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {isEditMode ? 'Edit Mode: ON' : 'Edit Mode: OFF'}
          </button>

          <button onClick={() => setHideEmpty(!hideEmpty)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            {hideEmpty ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {hideEmpty ? 'Tampilkan Kosong' : 'Sembunyikan Kosong'}
          </button>

          <button onClick={fetchStok} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alert Info */}
      <div className="bg-blue-50 text-blue-700 p-3 rounded-lg flex items-start gap-2 text-sm font-medium border border-blue-100">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Stok awal dikunci. Otomatis mengikuti stok akhir shift sebelumnya. Silakan edit stok akhir shift sebelumnya.</span>
      </div>

      {/* Tabs & Info */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="bg-white rounded-xl p-1.5 flex flex-wrap items-center gap-1.5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors outline-none cursor-pointer"
              style={{
                background: activeTab === t.id ? '#0F172A' : 'transparent',
                color: activeTab === t.id ? '#fff' : '#64748B',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {(loading || stokData) && (
          <div className="bg-white rounded-xl p-1.5 flex flex-wrap items-center gap-3" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div className="px-3 py-1.5 flex items-center gap-2 border-r border-slate-100 min-w-[120px]">
              <span className="text-xs font-semibold text-slate-500">Karyawan Jaga:</span>
              {loading ? (
                <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                <span className="text-sm font-bold text-slate-800">{stokData?.infoJaga || '-'}</span>
              )}
            </div>
            <div className="px-3 py-1.5 flex items-center gap-2 min-w-[120px]">
              <span className="text-xs font-semibold text-slate-500">Info Selisih:</span>
              {loading ? (
                <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                <span className={`text-sm font-bold ${(() => {
                  const raw = stokData?.selisih || '';
                  if (!raw || raw === '-') return 'text-slate-800';
                  const isNeg = String(raw).includes('-');
                  const val = Number(String(raw).replace(/[^0-9]/g, ''));
                  const num = isNeg ? -val : val;
                  if (num < 0) return 'text-red-600';
                  if (num === 0) return 'text-emerald-600';
                  return 'text-blue-600';
                })()}`}>
                  {stokData?.selisih || '-'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Area (Table) */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {renderTableContent()}
      </div>

      {/* FAB BATCH SAVE */}
      {(Object.keys(modifiedStok).length > 0 || Object.keys(modifiedPengeluaran).length > 0 || Object.keys(modifiedUang).length > 0 || Object.keys(modifiedElektrik).length > 0) && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={handleBatchSave}
            disabled={isSaving}
            className="flex items-center shadow-lg bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold transition-transform transform hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Simpan {Object.keys(modifiedStok).length + Object.keys(modifiedPengeluaran).length + Object.keys(modifiedUang).length + Object.keys(modifiedElektrik).length} Perubahan
          </button>
        </div>
      )}
    </div>
  );
};

export default DataStok;
