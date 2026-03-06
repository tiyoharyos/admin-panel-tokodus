'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import axios from '@/lib/axios';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import { Icon } from '@iconify/react';
import Swal from 'sweetalert2';

// ===== GLOBAL COMPONENTS =====
import LoadingState from '@/components/UI/LoadingState';
import ErrorState from '@/components/UI/ErrorState';

// ===== TYPES =====
interface MaterialType {
  id: string;
  name: string;
  material_type: string;
  is_premium: string; // '0' atau '1'
}

interface ApiResponse {
  status: number;
  message: string;
  data: MaterialType[];
}

interface FormData {
  name: string;
  material_type: string;
  is_premium: string;
}

// ===== CONSTANTS =====
const PREMIUM_OPTIONS = [
  { value: '0', label: 'Regular', color: '#64748b', icon: 'mdi:package' },
  { value: '1', label: 'Premium', color: '#f59e0b', icon: 'mdi:crown' },
];

// ===== VALIDATION =====
const validateMaterialTypeCode = (code: string): boolean => {
  const lettersOnlyRegex = /^[A-Za-z]+$/;
  return lettersOnlyRegex.test(code);
};

// ===== BADGE COMPONENT =====
function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: `${color}18`, color }}
    >
      {children}
    </span>
  );
}

// ===== UTILS =====
const showSuccess = async (title: string, message: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 2000,
    showConfirmButton: false,
    background: '#ffffff',
  });
};

const showError = async (title: string, message: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: '#6366f1',
    background: '#ffffff',
  });
};

const showWarning = async (title: string, message: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonColor: '#6366f1',
    background: '#ffffff',
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
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6B7280',
    background: '#ffffff',
  });
};

// ===== HOOKS =====
const useMaterialStats = (materials: MaterialType[]) => {
  return useMemo(() => {
    const total = materials.length;
    const premiumCount = materials.filter((m) => m.is_premium === '1').length;
    const regularCount = total - premiumCount;
    return { total, premiumCount, regularCount };
  }, [materials]);
};

// ===== MAIN COMPONENT =====
export default function MaterialTypePage() {
  const router = useRouter();

  // ===== STATE =====
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Validation state
  const [codeError, setCodeError] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialType | null>(null);
  const [form, setForm] = useState<FormData>({
    name: '',
    material_type: '',
    is_premium: '0',
  });

  const stats = useMaterialStats(materials);

  // ===== FILTERED DATA =====
  const filteredMaterials = useMemo(() => {
    return materials.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.material_type.toLowerCase().includes(search.toLowerCase()) ||
        item.id.includes(search)
    );
  }, [materials, search]);

  // ===== API CALLS =====
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<ApiResponse>('/Admin/Material/MaterialType');
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setMaterials(response.data.data);
      } else {
        setMaterials([]);
      }
    } catch (err: unknown) {
      console.error('Error fetching materials:', err);
      let errorMessage = 'Terjadi kesalahan saat memuat data';

      if (isAxiosError(err)) {
        if (err.response?.status === 404 || err.response?.status === 204) {
          setMaterials([]);
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
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // ===== HANDLERS =====
  const handleAdd = () => {
    setEditingItem(null);
    setForm({ name: '', material_type: '', is_premium: '0' });
    setCodeError('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: MaterialType) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      material_type: item.material_type,
      is_premium: item.is_premium,
    });
    setCodeError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (item: MaterialType) => {
    const result = await showConfirm('Hapus Material Type?', `Yakin ingin menghapus "${item.name}"?`);
    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      const response = await axios.delete(`/Admin/Material/MaterialTypeDel/${item.id}`);

      if (response.data?.status === 200) {
        await showSuccess('Terhapus!', `Material Type "${item.name}" berhasil dihapus.`);
        await fetchMaterials();
      } else {
        throw new Error(response.data?.message || 'Gagal menghapus data');
      }
    } catch (err: unknown) {
      let errorMessage = 'Terjadi kesalahan saat menghapus.';

      if (isAxiosError(err)) {
        if (err.response?.status === 409) {
          errorMessage = err.response.data?.message || 'Material Type tidak dapat dihapus karena masih digunakan';
        } else if (err.response?.status === 404) {
          errorMessage = 'Material Type tidak ditemukan';
        } else {
          errorMessage = err.response?.data?.message || err.message || errorMessage;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      await showError('Gagal!', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMaterialTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm({ ...form, material_type: value });

    if (value.length > 0) {
      if (!validateMaterialTypeCode(value)) {
        setCodeError('Material Type Code hanya boleh berisi huruf (A-Z, a-z)');
      } else {
        setCodeError('');
      }
    } else {
      setCodeError('');
    }
  };

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    // Validasi
    if (!form.name.trim()) {
      await showWarning('Validasi Gagal', 'Nama Material harus diisi.');
      return;
    }
    if (!form.material_type.trim()) {
      await showWarning('Validasi Gagal', 'Material Type Code harus diisi.');
      return;
    }
    if (!validateMaterialTypeCode(form.material_type)) {
      await showWarning('Validasi Gagal', 'Material Type Code hanya boleh berisi huruf (A-Z, a-z) tanpa angka atau simbol.');
      return;
    }
    if (form.is_premium === undefined || form.is_premium === null || form.is_premium === '') {
      await showWarning('Validasi Gagal', 'Status Material harus dipilih.');
      return;
    }

    try {
      setSubmitting(true);

      const isPremiumValue = form.is_premium === '0' ? '2' : '1'; 

      const params = new URLSearchParams();
      params.append('name', form.name.trim());
      params.append('material_type', form.material_type.trim().toUpperCase());
      params.append('is_premium', isPremiumValue);

      const config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

      let response;
      if (editingItem) {
        response = await axios.put(`/Admin/Material/MaterialTypeEdit/${editingItem.id}`, params, config);
      } else {
        response = await axios.post('/Admin/Material/MaterialTypeAdd', params, config);
      }

      if (response.data?.status === 200) {
        const action = editingItem ? 'diperbarui' : 'ditambahkan';
        await showSuccess('Berhasil!', `Material Type berhasil ${action}.`);
        setIsModalOpen(false);
        await fetchMaterials();
      } else {
        throw new Error(response.data?.message || 'Gagal menyimpan data');
      }

    } catch (err: unknown) {
      let errorMessage = 'Terjadi kesalahan saat menyimpan data.';

      if (isAxiosError(err)) {
        if (err.response?.status === 400) {
          errorMessage = err.response.data?.message || 'Data yang dimasukkan tidak valid';
        } else if (err.response?.status === 404) {
          errorMessage = 'Data tidak ditemukan';
        } else {
          errorMessage = err.response?.data?.message || err.message || errorMessage;
        }
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
      setCodeError('');
    }
  };

  // ===== LOADING / ERROR =====
  if (loading) {
    return <LoadingState message="Memuat Material Types..." submessage="Harap tunggu sebentar" icon="mdi:package-variant" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchMaterials} />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:package-variant" className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Material Type</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola jenis dan kode material produksi</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="md" onClick={fetchMaterials} icon="mdi:refresh">
            Refresh Data
          </Button>
          <Button variant="primary" size="md" onClick={handleAdd} icon="mdi:plus">
            Tambah Material
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: 'mdi:package-variant-closed',
            label: 'Total Material',
            value: String(stats.total),
            sub: 'Semua tipe terdaftar',
            accent: '#6366f1',
          },
          {
            icon: 'mdi:crown',
            label: 'Premium',
            value: String(stats.premiumCount),
            sub: 'Material premium',
            accent: '#f59e0b',
          },
          {
            icon: 'mdi:package',
            label: 'Regular',
            value: String(stats.regularCount),
            sub: 'Material reguler',
            accent: '#64748b',
          },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.accent}15` }}>
                <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.accent }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== TABLE CARD ===== */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Material Type</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.total} material · {stats.premiumCount} premium · {stats.regularCount} regular
            </p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, kode, atau ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {materials.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:package-variant-closed-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data material</p>
              <Button variant="primary" size="sm" onClick={handleAdd} icon="mdi:plus">
                Tambah Material
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Nama Material', 'Kode Type', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icon icon="mdi:package-variant-closed-off" className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
                        <p className="text-sm text-gray-400">
                          Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">
                          Hapus Pencarian
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((item) => {
                    const isPremium = item.is_premium === '1';
                    const accentColor = isPremium ? '#f59e0b' : '#6366f1';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: `${accentColor}15` }}
                            >
                              <Icon icon="mdi:package" className="w-5 h-5" style={{ color: accentColor }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{item.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge color={accentColor}>{item.material_type}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge color={isPremium ? '#f59e0b' : '#64748b'}>
                            {isPremium ? 'Premium' : 'Regular'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              title="Edit"
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              title="Hapus"
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Icon icon="mdi:delete-outline" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {filteredMaterials.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan{' '}
              <span className="font-medium text-slate-700">{filteredMaterials.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{materials.length}</span> material
            </p>
          </div>
        )}
      </Card>

      {/* ===== MODAL TAMBAH/EDIT ===== */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? `Edit Material — ${editingItem.name}` : 'Tambah Material Type'}
        size="md"
        closeOnOverlayClick={!submitting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseModal} disabled={submitting}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting || codeError !== ''}
              icon="mdi:check"
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          className="space-y-5"
        >
          {/* Info box */}
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            editingItem
              ? 'bg-amber-50 border-amber-200'
              : 'bg-indigo-50 border-indigo-200'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              editingItem ? 'bg-amber-100' : 'bg-indigo-100'
            }`}>
              <Icon
                icon={editingItem ? 'mdi:pencil-outline' : 'mdi:information-outline'}
                className={`w-5 h-5 ${editingItem ? 'text-amber-600' : 'text-indigo-600'}`}
              />
            </div>
            <div>
              <p className={`text-sm font-medium ${editingItem ? 'text-amber-800' : 'text-indigo-800'}`}>
                {editingItem ? 'Mode Edit' : 'Material Baru'}
              </p>
              <p className={`text-xs mt-1 ${editingItem ? 'text-amber-600' : 'text-indigo-600'}`}>
                {editingItem
                  ? `ID: ${editingItem.id} · Kode: ${editingItem.material_type}`
                  : 'Semua field wajib diisi'}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:package-variant" className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              Informasi Material
            </h4>

            {/* Nama */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Nama Material <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Brown Kraft"
                disabled={submitting}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white disabled:bg-gray-100 disabled:opacity-60"
                required
              />
            </div>

            {/* Material Type Code */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Material Type Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.material_type}
                onChange={handleMaterialTypeChange}
                placeholder="Contoh: K, W, D (hanya huruf)"
                disabled={submitting}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white disabled:bg-gray-100 disabled:opacity-60 font-mono uppercase ${
                  codeError ? 'border-red-500' : 'border-gray-200'
                }`}
                style={{ textTransform: 'uppercase' }}
                required
              />
              {codeError && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <Icon icon="mdi:alert-circle" className="w-3.5 h-3.5" />
                  {codeError}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Kode unik singkat untuk material type. <span className="font-semibold text-amber-600">Hanya huruf (A-Z, a-z)</span>
              </p>
            </div>

            {/* Status Premium/Regular */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status Material <span className="text-red-500">*</span>
              </label>

              <div className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {PREMIUM_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_premium"
                      value={option.value}
                      checked={form.is_premium === option.value}
                      onChange={(e) => setForm({ ...form, is_premium: e.target.value })}
                      disabled={submitting}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className={`text-sm font-medium ${
                      option.value === '1' ? 'text-amber-600' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Info status yang dipilih */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Status terpilih:</span>
                <Badge color={form.is_premium === '1' ? '#f59e0b' : '#64748b'}>
                  {form.is_premium === '1' ? 'PREMIUM' : 'REGULAR'}
                </Badge>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}