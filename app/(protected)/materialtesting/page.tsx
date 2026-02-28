'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import axios from '@/lib/axios';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Modal from '@/components/UI/Modal';
import { Icon } from '@iconify/react';
import Swal from 'sweetalert2';

// ===== GLOBAL COMPONENTS =====
import LoadingState from '@/components/UI/LoadingState';
import ErrorState from '@/components/UI/ErrorState';
import EmptyState from '@/components/UI/EmptyState';

// ===== TYPES =====
interface MaterialGramasi {
  id: string;           // ID gramasi
  material_type_id: string;
  gsm: string;          // Nilai gramasi
  name: string;         // Nama material type
  material_type: string; // Kode material type
  is_premium: string;   // '0' atau '1'
}

interface ApiResponse {
  message: string;
  data: MaterialGramasi[];
}

interface FormData {
  material_type_id: string;
  gsm: string;
}

// ===== UTILS =====
const showSuccess = async (title: string, message: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 2000,
    showConfirmButton: true,
    confirmButtonColor: '#3B82F6',
    background: '#ffffff',
    backdrop: `rgba(0,0,0,0.4)`,
  });
};

const showError = async (title: string, message: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: '#3B82F6',
    background: '#ffffff',
    backdrop: `rgba(0,0,0,0.4)`,
  });
};

const showConfirm = async (title: string, message: string) => {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#3B82F6',
    cancelButtonColor: '#6B7280',
    background: '#ffffff',
    backdrop: `rgba(0,0,0,0.4)`,
  });
};

// ===== HOOKS =====
const useGramasiStats = (gramasiList: MaterialGramasi[]) => {
  return useMemo(() => {
    const total = gramasiList.length;
    
    const materialGroups = gramasiList.reduce((acc: Record<string, { count: number, gsms: string[] }>, curr) => {
      if (!acc[curr.material_type]) {
        acc[curr.material_type] = {
          count: 0,
          gsms: []
        };
      }
      acc[curr.material_type].count++;
      acc[curr.material_type].gsms.push(curr.gsm);
      return acc;
    }, {});
    
    const uniqueMaterialTypes = new Set(gramasiList.map(item => item.material_type)).size;
    
    const gsmValues = gramasiList.map(item => parseInt(item.gsm)).filter(gsm => !isNaN(gsm));
    const minGsm = gsmValues.length > 0 ? Math.min(...gsmValues) : 0;
    const maxGsm = gsmValues.length > 0 ? Math.max(...gsmValues) : 0;
    
    return { 
      total, 
      uniqueMaterialTypes,
      minGsm,
      maxGsm,
      materialGroups 
    };
  }, [gramasiList]);
};

// ===== MAIN COMPONENT =====
export default function MaterialGramasiPage() {
  const router = useRouter();

  // ===== STATE =====
  const [gramasiList, setGramasiList] = useState<MaterialGramasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialGramasi | null>(null);
  const [form, setForm] = useState<FormData>({
    material_type_id: '',
    gsm: '',
  });

  const stats = useGramasiStats(gramasiList);

  // ===== DERIVED DATA =====
  // Extract unique material types for filter dropdown
  const materialTypeOptions = useMemo(() => {
    const materialMap = new Map();
    gramasiList.forEach(item => {
      if (!materialMap.has(item.material_type_id)) {
        materialMap.set(item.material_type_id, {
          id: item.material_type_id,
          name: item.name,
          code: item.material_type,
          is_premium: item.is_premium
        });
      }
    });
    return Array.from(materialMap.values());
  }, [gramasiList]);

  // Options untuk filter dropdown
  const filterSelectOptions = useMemo(() => {
    return [
      { value: '', label: 'Semua Material Type' },
      ...materialTypeOptions.map(type => ({
        value: type.id,
        label: `${type.name} (${type.code}) ${type.is_premium === '1' ? '⭐' : ''}`
      }))
    ];
  }, [materialTypeOptions]);

  // Options untuk modal form dropdown
  const formSelectOptions = useMemo(() => {
    return materialTypeOptions.map(type => ({
      value: type.id,
      label: `${type.name} (${type.code}) ${type.is_premium === '1' ? '⭐ Premium' : ''}`
    }));
  }, [materialTypeOptions]);

  // ===== FILTERED DATA =====
  const filteredGramasi = useMemo(() => {
    return gramasiList.filter((item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.material_type.toLowerCase().includes(search.toLowerCase()) ||
        item.gsm.includes(search) ||
        item.id.includes(search);
      
      const matchesMaterialType = selectedMaterialType === '' || item.material_type_id === selectedMaterialType;
      
      return matchesSearch && matchesMaterialType;
    });
  }, [gramasiList, search, selectedMaterialType]);

  // ===== API CALLS =====
  const fetchGramasi = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<ApiResponse>('/Admin/Material/MaterialGramasi');
      
      console.log('Response from MaterialGramasi:', response.data);
      
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setGramasiList(response.data.data);
      } else {
        setError('Data tidak valid atau tidak ditemukan.');
      }
    } catch (err: unknown) {
      console.error('Error fetching gramasi:', err);
      let errorMessage = 'Terjadi kesalahan saat memuat data';

      if (isAxiosError(err)) {
        if (err.response?.status === 404 || err.response?.status === 204) {
          setGramasiList([]);
          setError(null);
          return;
        }
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Koneksi timeout. Silakan coba lagi.';
        } else if (!err.response) {
          errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setGramasiList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGramasi();
  }, [fetchGramasi]);

  // ===== HANDLERS =====
  const handleAdd = () => {
    setEditingItem(null);
    setForm({ 
      material_type_id: materialTypeOptions[0]?.id || '', 
      gsm: '' 
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: MaterialGramasi) => {
    setEditingItem(item);
    setForm({
      material_type_id: item.material_type_id,
      gsm: item.gsm,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: MaterialGramasi) => {
    const result = await showConfirm(
      'Hapus Gramasi?', 
      `Yakin ingin menghapus gramasi ${item.gsm} untuk ${item.name} (${item.material_type})?`
    );
    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      await axios.delete(`/Admin/Material/MaterialGramasi/${item.id}`);
      await showSuccess('Terhapus!', `Gramasi ${item.gsm} berhasil dihapus.`);
      await fetchGramasi();
    } catch (err: unknown) {
      let errorMessage = 'Terjadi kesalahan saat menghapus.';
      if (isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      await showError('Gagal!', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Validasi
    if (!form.material_type_id) {
      await showError('Validasi Gagal', 'Material Type harus dipilih.');
      return;
    }
    if (!form.gsm.trim()) {
      await showError('Validasi Gagal', 'Nilai gramasi harus diisi.');
      return;
    }
    if (isNaN(Number(form.gsm)) || Number(form.gsm) <= 0) {
      await showError('Validasi Gagal', 'Nilai gramasi harus berupa angka positif.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await axios.put(`/Admin/Material/MaterialGramasi/${editingItem.id}`, form);
        await showSuccess('Berhasil!', 'Gramasi berhasil diperbarui.');
      } else {
        await axios.post('/Admin/Material/MaterialGramasi', form);
        await showSuccess('Berhasil!', 'Gramasi berhasil ditambahkan.');
      }
      setIsModalOpen(false);
      await fetchGramasi();
    } catch (err: unknown) {
      let errorMessage = 'Terjadi kesalahan saat menyimpan data.';
      if (isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      await showError('Gagal!', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setIsModalOpen(false);
      setEditingItem(null);
    }
  };

  // ===== RENDER =====
  if (loading) {
    return <LoadingState message="Memuat data gramasi..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchGramasi} />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Icon icon="mdi:weight" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Material Gramasi
            </h1>
            <p className="text-gray-600 mt-1">Kelola gramasi per material type</p>
          </div>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Icon icon="mdi:plus" className="w-5 h-5" />
          Tambah Gramasi
        </Button>
      </div>

      {/* ===== STATS CARD ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:weight" className="w-4 h-4 text-blue-600" />
              Total Gramasi
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">semua jenis material</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full group-hover:bg-green-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:package-variant" className="w-4 h-4 text-green-600" />
              Jenis Material
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.uniqueMaterialTypes}</p>
            <p className="text-xs text-gray-500">material type</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:arrow-down" className="w-4 h-4 text-amber-600" />
              Min Gramasi
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.minGsm}</p>
            <p className="text-xs text-gray-500">gsm terendah</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full group-hover:bg-purple-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:arrow-up" className="w-4 h-4 text-purple-600" />
              Max Gramasi
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.maxGsm}</p>
            <p className="text-xs text-gray-500">gsm tertinggi</p>
          </div>
        </Card>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <Icon icon="mdi:magnify" className="w-5 h-5 text-gray-400 ml-2" />
          <Input
            placeholder="Cari berdasarkan nama material, kode, atau gsm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus:ring-0"
          />
          {search && (
            <Button
              onClick={() => setSearch('')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <Icon icon="mdi:filter" className="w-5 h-5 text-gray-400 ml-2" />
          <Select
            options={filterSelectOptions}
            value={selectedMaterialType}
            onChange={(e) => setSelectedMaterialType(e.target.value)}
            className="w-full p-2 bg-transparent border-0 focus:ring-0 text-gray-700"
            placeholder="Pilih Material Type"
          />
          {selectedMaterialType && (
            <Button
              onClick={() => setSelectedMaterialType('')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
            </Button>
          )}
        </div>
      </div>

      {/* ===== TABLE CARD ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Material Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Gramasi (GSM)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGramasi.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <EmptyState
                      icon="mdi:weight"
                      title="Tidak ada data gramasi"
                      message="Coba ubah filter pencarian atau tambahkan gramasi baru."
                      actionLabel="Clear Filter"
                      onAction={() => {
                        setSearch('');
                        setSelectedMaterialType('');
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredGramasi.map((item) => (
                  <tr key={`${item.id}-${item.gsm}`} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">#{item.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mr-3">
                          <Icon icon="mdi:package" className="w-4 h-4 text-gray-700" />
                        </div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        {item.material_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-semibold text-gray-900">{item.gsm}</span>
                      <span className="text-sm text-gray-500 ml-1">gsm</span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Icon icon="mdi:pencil" className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Icon icon="mdi:delete" className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredGramasi.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-sm text-gray-600">
              Menampilkan {filteredGramasi.length} dari {gramasiList.length} gramasi
            </div>
            <div className="text-sm text-gray-500">
              {stats.uniqueMaterialTypes} jenis material • {stats.minGsm} - {stats.maxGsm} gsm
            </div>
          </div>
        )}
      </Card>

      {/* ===== MODAL TAMBAH/EDIT ===== */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Material Gramasi' : 'Tambah Material Gramasi'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal} disabled={submitting}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Material Type
            </label>
            <Select
              options={formSelectOptions}
              value={form.material_type_id}
              onChange={(e) => setForm({ ...form, material_type_id: e.target.value })}
              disabled={submitting}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Pilih Material Type"
              required
            />
          </div>
          
          <Input
            label="Gramasi (GSM)"
            type="number"
            value={form.gsm}
            onChange={(e) => setForm({ ...form, gsm: e.target.value })}
            placeholder="Contoh: 125, 150, 200"
            disabled={submitting}
            min="1"
            step="1"
            required
            helperText="Masukkan nilai gramasi dalam angka (gsm)"
          />
        </form>
      </Modal>
    </div>
  );
}