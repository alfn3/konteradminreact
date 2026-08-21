import React, { useState, useEffect } from 'react';
import { Package, Search, Calendar, Store, Plus, FileSpreadsheet, Loader2, RefreshCw, Save, Eye, EyeOff, Edit2, Lock, Unlock } from 'lucide-react';
import { gasService } from '../services/gas';

const getProviderBadge = (providerName) => {
  if (!providerName || providerName === '-') return 'bg-slate-100 text-slate-600 border-slate-200';
  const nameUpper = providerName.toUpperCase();
  if (nameUpper.includes('TELKOMSEL') || nameUpper.includes('AS') || nameUpper.includes('SIMPATI') || nameUpper.includes('BYU')) {
    return 'bg-red-100 text-red-700 font-bold border-red-200';
  }
  if (nameUpper.includes('INDOSAT') || nameUpper.includes('IM3') || nameUpper.includes('ISAT')) {
    return 'bg-yellow-100 text-yellow-700 font-bold border-yellow-200';
  }
  if (nameUpper === 'XL' || nameUpper.includes('XL AXIATA') || nameUpper.includes('AXIS')) {
    return 'bg-blue-100 text-blue-700 font-bold border-blue-200';
  }
  if (nameUpper.includes('SMARTFREN')) {
    return 'bg-pink-100 text-pink-700 font-bold border-pink-200';
  }
  if (nameUpper === 'TRI' || nameUpper === 'THREE' || nameUpper === '3' || nameUpper.includes('THREE')) {
    return 'bg-slate-800 text-white font-bold border-slate-700';
  }
  // Hash fallback for acc / unmapped providers
  let hash = 0;
  for (let i = 0; i < providerName.length; i++) {
    hash = providerName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
    'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    'bg-orange-100 text-orange-700 border-orange-200'
  ];
  return colors[Math.abs(hash) % colors.length] + ' font-bold';
};

const RestokCurrencyInput = ({ value, onChange, className }) => {
  const [isFocused, setIsFocused] = useState(false);
  const numVal = Number(String(value).replace(/[^0-9]/g, '')) || 0;
  
  return (
    <input
      type={isFocused ? "number" : "text"}
      value={isFocused ? (numVal || '') : (numVal ? `Rp ${numVal.toLocaleString('id-ID')}` : '')}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder=""
    />
  );
};

const DataStok = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState('perdana');
  const [toko, setToko] = useState(''); // Akan di-set setelah fetch konter
  const [konterOptions, setKonterOptions] = useState([]);
  const [storeColors, setStoreColors] = useState({});

  const [tanggal, setTanggal] = useState(() => {
    return new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
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

  // Modal Restok State
  const [showRestokModal, setShowRestokModal] = useState(false);

  const [restokSelected, setRestokSelected] = useState(null);
  const [restokQty, setRestokQty] = useState('');
  const [restokTab, setRestokTab] = useState('perdana');

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
    const updates = Object.values(modifiedStok).map(item => {
      const payload = {
        row: item.row,
        kategori: item.kategori,
        produk: item.produk,
        topup: item.topup === '' ? '' : item.topup,
        stokAkhir: item.stokAkhir === '' ? '' : item.stokAkhir
      };
      if (item.harga !== undefined) payload.hj = item.harga === '' ? '' : item.harga;
      if (item.hpp !== undefined) payload.hpp = item.hpp === '' ? '' : item.hpp;
      return payload;
    });
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
                {currentBase === 'STOK GUDANG' && <th className="px-4 py-3 text-right">HPP</th>}
                <th className="px-4 py-3 text-right">Harga Jual</th>
                <th className="px-4 py-3 text-center w-24">{currentBase === 'STOK GUDANG' ? 'Stok Keluar' : 'Terjual'}</th>
                {currentBase !== 'STOK GUDANG' && (
                  <th className="px-4 py-3 text-center w-24 bg-slate-700 text-white border-l border-slate-600 rounded-tr-lg">Gudang</th>
                )}
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
                const mod = modifiedStok[item.realRow];
                const awalVal = mod?.stokAwal ?? item.stokAwal;
                const topupVal = mod?.topup ?? item.topup;
                const akhirVal = mod?.stokAkhir ?? item.stokAkhir;
                const awal = Number(awalVal) || 0;
                const topup = Number(topupVal) || 0;
                const akhir = Number(akhirVal) || 0;
                const terjual = (akhirVal === "" || akhirVal === null || akhirVal === undefined) ? "" : ((awal + topup) - akhir);

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



                const badgeClass = getProviderBadge(providerText);

                const renderEditableCurrency = (field, rawVal) => {
                  const isEditing = editingCell?.row === item.realRow && editingCell?.field === field;
                  const numVal = Number(String(rawVal).replace(/[^0-9]/g, '')) || 0;
                  const displayVal = numVal === 0 ? "" : `Rp ${numVal.toLocaleString('id-ID')}`;

                  if (isEditing && isEditMode) {
                    return (
                      <div className="flex items-center justify-end p-1 rounded bg-white shadow-sm ring-1 ring-primary/50 min-w-[90px] h-9 relative ml-auto">
                        <input
                          type="number"
                          autoFocus
                          onBlur={() => setEditingCell(null)}
                          className="w-full text-right bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          onWheel={(e) => e.target.blur()}
                          value={modifiedStok[item.realRow]?.[field] ?? (numVal === 0 ? "" : numVal)}
                          onChange={(e) => handleStokChange(item, field, e.target.value)}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
                          }}
                        />
                      </div>
                    );
                  }

                  let textColor = "text-slate-800";
                  let extraInfo = null;
                  
                  if (field === 'harga') {
                      const hppRaw = modifiedStok[item.realRow]?.hpp ?? item.hpp;
                      const hppNum = Number(String(hppRaw || '0').replace(/[^0-9]/g, '')) || 0;
                      if (numVal < hppNum) textColor = "text-red-600";
                      
                      const marginNum = numVal - hppNum;
                      extraInfo = (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded whitespace-nowrap mt-0.5">
                          Margin: Rp {marginNum.toLocaleString('id-ID')}
                        </span>
                      );
                  }

                  return (
                    <div
                      className={`group flex flex-col items-end justify-center p-1.5 rounded transition-colors relative w-full ${isEditMode ? 'cursor-pointer hover:bg-slate-200/50' : ''}`}
                      onClick={() => isEditMode && setEditingCell({ row: item.realRow, field })}
                    >
                      <span className={`text-right font-semibold ${textColor}`}>{displayVal}</span>
                      {extraInfo}
                      {isEditMode && <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 ml-1 absolute left-1 top-2 transition-opacity" />}
                    </div>
                  );
                };

                const renderEditableCell = (field, val, extraClass = '') => {
                  const isEditing = editingCell?.row === item.realRow && editingCell?.field === field;
                  const displayVal = (val === 0 || val === "0") ? "" : val;

                  if (isEditing && isEditMode) {
                    return (
                      <div className={`flex items-center justify-center p-1 rounded bg-white shadow-sm ring-1 ring-primary/50 w-16 h-9 relative ${extraClass}`}>
                        <input
                          type="number"
                          autoFocus
                          onBlur={() => setEditingCell(null)}
                          className="w-full text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          onWheel={(e) => e.target.blur()}
                          value={modifiedStok[item.realRow]?.[field] ?? ((item[field] === "" || item[field] === 0 || item[field] === "0") ? "" : (item[field] ?? ""))}
                          onChange={(e) => handleStokChange(item, field, e.target.value)}
                          onKeyDown={(e) => {
                            const isUp = e.key === 'ArrowUp';
                            const isDown = e.key === 'ArrowDown' || e.key === 'Enter';
                            const isLeft = e.key === 'ArrowLeft';
                            const isRight = e.key === 'ArrowRight';
                            
                            if (isUp || isDown || isLeft || isRight) {
                              const currentIndex = arr.findIndex(x => x.realRow === item.realRow);
                              if (isUp || isDown) {
                                e.preventDefault(); e.target.blur();
                                const dir = isUp ? -1 : 1;
                                if (currentIndex + dir >= 0 && currentIndex + dir < arr.length) {
                                  setTimeout(() => setEditingCell({ row: arr[currentIndex + dir].realRow, field }), 10);
                                }
                              } else if (isLeft || isRight) {
                                if (isLeft && field === 'stokAkhir') {
                                  e.preventDefault(); e.target.blur();
                                  setTimeout(() => setEditingCell({ row: item.realRow, field: 'topup' }), 10);
                                } else if (isRight && field === 'topup') {
                                  e.preventDefault(); e.target.blur();
                                  setTimeout(() => setEditingCell({ row: item.realRow, field: 'stokAkhir' }), 10);
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      className={`group flex items-center justify-center p-1.5 rounded transition-colors w-16 h-9 relative ${isEditMode ? 'cursor-pointer hover:bg-slate-200/50' : ''} ${extraClass}`}
                      onClick={() => isEditMode && setEditingCell({ row: item.realRow, field })}
                      title={isEditMode ? 'Klik untuk edit' : ''}
                    >
                      <span className="text-center font-medium">{displayVal}</span>
                      {isEditMode && <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 ml-1 absolute right-1 transition-opacity" />}
                    </div>
                  );
                };

                const initialTopup = Number(item.topup) || 0;
                const topupDiff = topup - initialTopup;
                const gudangRaw = item.stokGudang === "" ? "" : (Number(item.stokGudang) - topupDiff);
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
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center justify-center p-1.5 rounded text-slate-600 font-medium w-16 h-9">
                          {awalVal === "0" || awalVal === 0 ? "" : awalVal}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-center">
                        {renderEditableCell('topup', topupVal, (topupVal && Number(topupVal) > 0) ? 'text-emerald-600 font-bold' : '')}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-center">
                        {renderEditableCell('stokAkhir', akhirVal, '')}
                      </div>
                    </td>
                    
                    {currentBase === 'STOK GUDANG' && (
                      <td className="px-4 py-3 text-right text-slate-500 align-top">
                        {renderEditableCurrency('hpp', mod?.hpp ?? item.hpp)}
                      </td>
                    )}

                    <td className="px-4 py-3 text-right align-top">
                      {currentBase === 'STOK GUDANG' ? (
                        renderEditableCurrency('harga', mod?.harga ?? item.harga)
                      ) : (
                        <span className="font-semibold text-slate-800">Rp {hargaNum.toLocaleString('id-ID')}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {terjual !== "" && terjual !== 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${terjual > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {terjual}
                        </span>
                      )}
                    </td>

                    {currentBase !== 'STOK GUDANG' && (
                      <td className={`px-4 py-3 text-center bg-slate-200/70 border-l border-slate-300 shadow-inner ${gudangTextClass}`}>
                        {gudangText}
                      </td>
                    )}
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
                    const isUp = e.key === 'ArrowUp';
                    const isDown = e.key === 'ArrowDown' || e.key === 'Enter';
                    const isLeft = e.key === 'ArrowLeft';
                    const isRight = e.key === 'ArrowRight';
                    
                    if (isUp || isDown || isLeft || isRight) {
                      const arrPeng = stokData.pengeluaran?.filter(i => {
                        if (!hideEmpty) return true;
                        if (editingCell?.row === i.row) return true;
                        const mod = modifiedPengeluaran[i.row];
                        const nom = Number(mod?.nominal ?? i.nominal) || 0;
                        const ket = ((mod?.keterangan ?? i.keterangan) || '').toString().trim();
                        return nom !== 0 || (ket !== '' && ket !== '-');
                      }) || [];
                      const currentIndex = arrPeng.findIndex(x => x.row === item.row);
                      
                      if (isUp || isDown) {
                        e.preventDefault(); e.target.blur();
                        const dir = isUp ? -1 : 1;
                        if (currentIndex + dir >= 0 && currentIndex + dir < arrPeng.length) {
                          setTimeout(() => setEditingCell({ row: arrPeng[currentIndex + dir].row, field }), 10);
                        }
                      } else if (isLeft || isRight) {
                        if (isLeft && field === 'keterangan') {
                          e.preventDefault(); e.target.blur();
                          setTimeout(() => setEditingCell({ row: item.row, field: 'nominal' }), 10);
                        } else if (isRight && field === 'nominal') {
                          e.preventDefault(); e.target.blur();
                          setTimeout(() => setEditingCell({ row: item.row, field: 'keterangan' }), 10);
                        }
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
                    const isUp = e.key === 'ArrowUp';
                    const isDown = e.key === 'ArrowDown' || e.key === 'Enter';
                    const isLeft = e.key === 'ArrowLeft';
                    const isRight = e.key === 'ArrowRight';
                    
                    if (isUp || isDown || isLeft || isRight) {
                      const arrElektrik = stokData.elektrik || [];
                      const currentIndex = arrElektrik.findIndex(x => x.realRow === item.realRow);
                      
                      if (isUp || isDown) {
                        e.preventDefault(); e.target.blur();
                        const dir = isUp ? -1 : 1;
                        if (currentIndex + dir >= 0 && currentIndex + dir < arrElektrik.length) {
                          setTimeout(() => setEditingCell({ row: arrElektrik[currentIndex + dir].realRow, field }), 10);
                        }
                      } else if (isLeft || isRight) {
                        const fields = ['saldoAwal', 'topup', 'saldoAkhir'];
                        const fIdx = fields.indexOf(field);
                        const newFIdx = fIdx + (isLeft ? -1 : 1);
                        if (newFIdx >= 0 && newFIdx < fields.length) {
                          e.preventDefault(); e.target.blur();
                          setTimeout(() => setEditingCell({ row: item.realRow, field: fields[newFIdx] }), 10);
                        }
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
                    const isUp = e.key === 'ArrowUp';
                    const isDown = e.key === 'ArrowDown' || e.key === 'Enter';
                    if (isUp || isDown) {
                      e.preventDefault(); e.target.blur();
                      const arrUang = stokData.uang || [];
                      const currentIndex = arrUang.findIndex(x => x.row === item.row);
                      const dir = isUp ? -1 : 1;
                      if (currentIndex + dir >= 0 && currentIndex + dir < arrUang.length) {
                        setTimeout(() => setEditingCell({ row: arrUang[currentIndex + dir].row, field: 'list' }), 10);
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

  // --- LOGIC SPLIT PAGI/SORE ---
  const parseKonterLabel = (label) => {
    const upper = label.toUpperCase();
    if (upper.endsWith(' PAGI')) return { base: upper.replace(' PAGI', '').trim(), shift: 'PAGI' };
    if (upper.endsWith(' SORE')) return { base: upper.replace(' SORE', '').trim(), shift: 'SORE' };
    return { base: upper, shift: null };
  };

  const baseBases = Array.from(new Set(konterOptions.map(opt => parseKonterLabel(opt.label).base)));
  
  const currentOpt = konterOptions.find(o => o.value === toko);
  const currentLabel = currentOpt ? currentOpt.label : (toko === 'stok gudang' ? 'STOK GUDANG' : '');
  const { base: currentBase, shift: currentShift } = parseKonterLabel(currentLabel);

  const handleBaseChange = (newBase) => {
    if (newBase === 'STOK GUDANG') {
      if (['pengeluaran', 'uang', 'elektrik'].includes(activeTab)) {
        setActiveTab('perdana');
      }
      setToko('stok gudang');
      return;
    }
    let targetOpt = konterOptions.find(o => {
      const p = parseKonterLabel(o.label);
      return p.base === newBase && p.shift === currentShift;
    });
    if (!targetOpt) targetOpt = konterOptions.find(o => parseKonterLabel(o.label).base === newBase);
    if (targetOpt) setToko(targetOpt.value);
  };

  const handleShiftChange = (newShift) => {
    const targetOpt = konterOptions.find(o => {
      const p = parseKonterLabel(o.label);
      return p.base === currentBase && p.shift === newShift;
    });
    if (targetOpt) setToko(targetOpt.value);
  };
  // -----------------------------

  const availableTabs = currentBase === 'STOK GUDANG' 
    ? tabs.filter(t => !['pengeluaran', 'uang', 'elektrik'].includes(t.id))
    : tabs;

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
            max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
            onChange={(e) => setTanggal(e.target.value)}
            className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          />
        </div>

        {konterOptions.length === 0 ? (
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={currentBase}
              onChange={(e) => handleBaseChange(e.target.value)}
              className="text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer transition-colors shadow-sm"
              style={{
                backgroundColor: currentBase === 'STOK GUDANG' ? '#10B981' : (toko ? (storeColors[konterOptions.find(o => parseKonterLabel(o.label).base === currentBase)?.label] || storeColors[currentBase] || '#3B82F6') : '#3B82F6'),
                color: '#fff',
                border: 'none'
              }}
            >
              {baseBases.map((base, idx) => (
                <option key={idx} value={base} className="bg-white text-slate-800 font-medium">{base}</option>
              ))}
              <option value="STOK GUDANG" className="bg-white text-emerald-600 font-bold bg-emerald-50">STOK GUDANG</option>
            </select>
            
            {/* Shift Switcher (Only show if not STOK GUDANG) */}
            {currentBase !== 'STOK GUDANG' && (
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => handleShiftChange('PAGI')}
                  className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${currentShift === 'PAGI' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  PAGI
                </button>
                <button
                  onClick={() => handleShiftChange('SORE')}
                  className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${currentShift === 'SORE' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  SORE
                </button>
              </div>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setIsEditMode(!isEditMode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isEditMode ? 'bg-primary text-white shadow-sm ring-2 ring-primary/50' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}>
            {isEditMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {isEditMode ? 'Mode Edit Aktif' : 'Buka Edit'}
          </button>

          {currentBase === 'STOK GUDANG' && (
            <button onClick={() => { setShowRestokModal(true); setRestokSearch(''); setRestokSelected(null); setRestokQty(''); }} className="hidden">
            </button>
          )}

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

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white rounded-xl p-1.5 flex flex-wrap items-center gap-1.5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            {availableTabs.map((t) => (
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

          {currentBase === 'STOK GUDANG' && (
            <button 
              onClick={() => { setShowRestokModal(true); setRestokSearch(''); setRestokSelected(null); setRestokQty(''); }} 
              className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm border border-emerald-700"
            >
              <Package className="w-4 h-4" />
              Restok
            </button>
          )}
        </div>

        {(loading || stokData) && currentBase !== 'STOK GUDANG' && (
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
      {!showRestokModal && (Object.keys(modifiedStok).length > 0 || Object.keys(modifiedPengeluaran).length > 0 || Object.keys(modifiedUang).length > 0 || Object.keys(modifiedElektrik).length > 0) && (
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

      {/* RESTOK MODAL */}
      {showRestokModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]">
            
            {/* KIRI: Daftar Produk */}
            <div className="flex-1 flex flex-col h-full border-r border-slate-200 bg-slate-50/50">
              <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Restok Gudang
                </h3>
                <button onClick={() => setShowRestokModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors md:hidden">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4 flex-1 flex flex-col overflow-hidden">
                <div className="flex gap-2 mb-4 shrink-0">
                  {['perdana', 'voucher', 'acc'].map(cat => {
                    const isActive = restokTab === cat;
                    let colorClass = 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700';
                    if (isActive) {
                      if (cat === 'perdana') colorClass = 'bg-blue-50 border-blue-500 text-blue-700';
                      else if (cat === 'voucher') colorClass = 'bg-orange-50 border-orange-500 text-orange-700';
                      else colorClass = 'bg-purple-50 border-purple-500 text-purple-700';
                    }
                    return (
                      <button 
                        key={cat}
                        onClick={() => setRestokTab(cat)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${colorClass}`}
                      >
                        {cat === 'acc' ? 'Aksesoris' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    );
                  })}
                </div>
                
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-2 py-2 w-10 text-center">No</th>
                          <th className="px-2 py-2">Kategori</th>
                          <th className="px-3 py-2 min-w-[150px]">Produk</th>
                          <th className="px-2 py-2 w-16 text-center">Stok Awal</th>
                          <th className="px-2 py-2 w-20 text-center text-emerald-600">Masuk</th>
                          <th className="px-2 py-2 w-24 text-center">HPP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stokData && stokData[restokTab] ? stokData[restokTab].map((item, idx, arr) => {
                          const prevItem = idx > 0 ? arr[idx - 1] : null;
                          const isProviderChanged = prevItem && prevItem.provider !== item.provider;
                          
                          return (
                          <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${isProviderChanged ? 'border-t-2 border-dashed border-slate-300' : ''}`}>
                            <td className="px-2 py-2 text-center text-slate-500 text-xs">{idx + 1}</td>
                            <td className="px-2 py-2">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap ${getProviderBadge(item.provider || '')}`}>
                                {item.provider || '-'}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-semibold text-slate-800 text-xs">
                              {item.nama}
                            </td>
                            <td className="px-2 py-2 text-center text-slate-600 font-medium text-xs">
                              {item.stokAwal == 0 ? "" : item.stokAwal}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center">
                                <input 
                                  type="number"
                                  value={modifiedStok[item.realRow]?.topup ?? item.topup}
                                  onChange={(e) => handleStokChange(item, 'topup', e.target.value)}
                                  className="w-14 px-1 py-1 text-center text-sm font-black bg-transparent text-emerald-700 outline-none rounded transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder=""
                                />
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center">
                                <RestokCurrencyInput 
                                  value={modifiedStok[item.realRow]?.hpp ?? (String(item.hpp || '0').replace(/[^0-9]/g, ''))}
                                  onChange={(val) => handleStokChange(item, 'hpp', val)}
                                  className="w-20 px-1 py-1 text-center text-xs font-bold bg-transparent text-slate-800 outline-none hover:bg-slate-100 focus:bg-slate-200 rounded transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </td>
                          </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="6" className="text-center p-6 text-slate-500 text-sm">
                              Produk tidak ditemukan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            {/* KANAN: Nota Perhitungan */}
            <div className="w-full md:w-[400px] flex flex-col bg-slate-100 h-full shrink-0 border-l border-slate-200">
              <div className="p-4 flex items-center justify-between shrink-0">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                   Nota Perhitungan
                 </h3>
                 <button onClick={() => setShowRestokModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors hidden md:block">
                   <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {/* Kertas Nota */}
                <div className="bg-white p-5 shadow-sm border border-slate-200 min-h-full font-mono text-sm relative flex flex-col">
                   <div className="text-center font-bold text-lg mb-2 border-b-2 border-dashed border-slate-300 pb-3">
                     NOTA RESTOK
                   </div>
                   
                   <div className="space-y-3 py-4 flex-1">
                     {(() => {
                        const changedItems = Object.values(modifiedStok).filter(m => Number(m.topup) > 0 || (m.hpp !== undefined));
                        if (changedItems.length === 0) {
                          return <div className="text-center text-slate-400 my-8 italic">Belum ada barang masuk...</div>;
                        }
                        
                        return changedItems.map(m => {
                           const originalItem = ([]).concat(stokData?.perdana || [], stokData?.voucher || [], stokData?.acc || []).find(x => x.realRow === m.row);
                           const nama = originalItem?.nama || m.produk;
                           const qty = Number(m.topup) || 0;
                           const hpp = Number(String((m.hpp ?? originalItem?.hpp) || '0').replace(/[^0-9]/g, '')) || 0;
                           const subtotal = qty * hpp;
                           return (
                             <div key={m.row} className="flex justify-between items-start text-xs border-b border-dashed border-slate-200 pb-2">
                               <div className="flex-1 pr-2">
                                 <div className="font-semibold text-slate-800 uppercase line-clamp-2 leading-tight">{nama}</div>
                                 <div className="text-slate-500 mt-1">
                                   {qty > 0 ? (
                                      <>{qty} x {hpp.toLocaleString('id-ID')}</>
                                   ) : (
                                      <span className="italic text-slate-400">Ubah HPP</span>
                                   )}
                                 </div>
                               </div>
                               <div className="font-bold text-slate-800 shrink-0 text-right">
                                 {subtotal.toLocaleString('id-ID')}
                               </div>
                             </div>
                           );
                        });
                     })()}
                   </div>

                   <div className="border-t-2 border-dashed border-slate-300 pt-3 mt-4 shrink-0">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-600 uppercase">Total</span>
                        <span className="text-lg font-black text-slate-900">
                          Rp {
                            Object.values(modifiedStok).reduce((acc, m) => {
                               const originalItem = ([]).concat(stokData?.perdana || [], stokData?.voucher || [], stokData?.acc || []).find(x => x.realRow === m.row);
                               const qty = Number(m.topup) || 0;
                               const hpp = Number(String((m.hpp ?? originalItem?.hpp) || '0').replace(/[^0-9]/g, '')) || 0;
                               return acc + (qty * hpp);
                            }, 0).toLocaleString('id-ID')
                          }
                        </span>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <button
                  onClick={() => {
                    handleBatchSave();
                    setShowRestokModal(false);
                  }}
                  disabled={isSaving || Object.values(modifiedStok).length === 0}
                  className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 disabled:shadow-none"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Simpan Perubahan
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DataStok;
