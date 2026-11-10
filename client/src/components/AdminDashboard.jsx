import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteCategory,
  deleteAdmin,
  deleteProduct,
  fetchOrders,
  fetchAdmins,
  fetchCategories,
  fetchProducts,
  fetchStoreSettings,
  saveAdmin,
  saveCategory,
  saveProduct,
  saveStoreSettings,
  toggleProductStock,
  updateOrderStatus,
} from '../services/api';
import { AlertTriangle, ArrowRight, Check, ClipboardList, Flower2, ImagePlus, KeyRound, MapPin, MessageCircle, Phone, ShieldCheck, Store, Trash2, Truck, UserRound } from 'lucide-react';

import lambangBunga from '../assets/admin/icons/lambang-bunga.svg';
import ikon from '../assets/admin/icons/ikon.svg';
import layers from '../assets/admin/icons/layers.svg';
import store from '../assets/admin/icons/store.svg';
import logOut from '../assets/admin/icons/log-out.svg';
import plus from '../assets/admin/icons/plus.svg';
import circleCheck from '../assets/admin/icons/circle-check.svg';
import packageImg from '../assets/admin/icons/package.svg';
import ikon2 from '../assets/admin/icons/ikon2.svg';
import ikon3 from '../assets/admin/icons/ikon3.svg';
import sakelarStok from '../assets/admin/icons/sakelar-stok.svg';
import ikon4 from '../assets/admin/icons/ikon4.svg';
import ikon5 from '../assets/admin/icons/ikon5.svg';
import sakelarStok1 from '../assets/admin/icons/sakelar-stok1.svg';
import ikon6 from '../assets/admin/icons/ikon6.svg';
import xClose from '../assets/admin/icons/x.svg';

import fotoBunga0 from '../assets/admin/images/foto-bunga0.png';
import fotoBunga1 from '../assets/admin/images/foto-bunga1.png';
import fotoBunga2 from '../assets/admin/images/foto-bunga2.png';
import fotoBunga3 from '../assets/admin/images/foto-bunga3.png';
import fotoBunga4 from '../assets/admin/images/foto-bunga4.png';
import fotoBunga5 from '../assets/admin/images/foto-bunga5.png';
import fotoBunga6 from '../assets/admin/images/foto-bunga6.png';
import fotoBunga7 from '../assets/admin/images/foto-bunga7.png';

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function formatOrderDate(value) {
  const timestamp = String(value || '');
  const normalized = timestamp.includes('T') ? timestamp : `${timestamp.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString('id-ID');
}

function getImageSource(image) {
  if (!image) return '';
  if (/^https?:\/\//i.test(image) || image.startsWith('/')) return image;
  return `/uploads/${encodeURIComponent(image)}`;
}

function isInStock(product) {
  return Number(product.stock) > 0 && product.stockStatus !== 'Habis';
}

function AdminEditorDialog({ type, item, categories, storeName, saving, error, onSave, onClose }) {
  const [form, setForm] = useState(() => type === 'product'
    ? {
        name: item?.name || '',
        categoryId: item?.categoryId || categories[0]?.id || '',
        price: item?.price ?? '',
        stock: item?.stock ?? 0,
        description: item?.description || '',
        badge: item?.badge || '',
        image: item?.image || '',
      }
    : {
        name: item?.name || '',
        description: item?.description || '',
      });
  const [imagePreview, setImagePreview] = useState(() =>
    typeof item?.image === 'string' ? getImageSource(item.image) : '',
  );
  const [photoError, setPhotoError] = useState('');

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function updateField(event) {
    const { name, value, files } = event.target;
    const file = files?.[0];
    if (name === 'image') {
      if (file) selectPhoto(file);
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  }

  function selectPhoto(file) {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!acceptedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      setPhotoError('Pilih foto JPG, PNG, WEBP, atau GIF dengan ukuran maksimal 5 MB.');
      return;
    }
    setForm((current) => ({ ...current, image: file }));
    setImagePreview(URL.createObjectURL(file));
    setPhotoError('');
  }

  function dropPhoto(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) selectPhoto(file);
  }

  function toggleAvailability() {
    setForm((current) => ({
      ...current,
      stock: Number(current.stock) > 0 ? 0 : 1,
    }));
  }

  function submit(event) {
    event.preventDefault();
    if (type === 'product' && !item && !form.image) {
      setPhotoError('Pilih foto produk sebelum menyimpan.');
      return;
    }
    onSave(form);
  }

  const isProduct = type === 'product';
  return (
    <div className={`admin-modal-overlay${isProduct ? ' admin-modal-overlay--product' : ''}`} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className={`admin-modal${isProduct ? ' admin-modal--product' : ''}`} role="dialog" aria-modal="true" aria-labelledby="admin-editor-title">
        <header className={`admin-modal__header${isProduct ? ' admin-modal__header--product' : ''}`}>
          <div>
            <p>{isProduct ? `Katalog ${storeName}` : item ? 'Perbarui katalog' : `Katalog ${storeName}`}</p>
            <h2 id="admin-editor-title">
              {item ? 'Edit' : 'Tambah'} {isProduct ? 'produk bunga' : 'kategori'}
            </h2>
            {isProduct && <span>Rangkaian baru untuk melengkapi cerita pelangganmu.</span>}
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Tutup">
            <img src={xClose} alt="" width={19} height={19} />
          </button>
        </header>
        <form className={`admin-editor-form${isProduct ? ' admin-editor-form--product' : ''}`} onSubmit={submit}>
          {isProduct ? (
            <>
              <div className="admin-product-editor__layout">
                <div className="admin-product-editor__fields">
                  <label className="admin-form-field">
                    <span>Nama produk <b>*</b></span>
                    <input name="name" value={form.name} onChange={updateField} required maxLength={100} placeholder="Contoh: Senandung Mawar" />
                  </label>
                  <label className="admin-form-field">
                    <span>Kategori <b>*</b></span>
                    <select name="categoryId" value={form.categoryId} onChange={updateField} required>
                      <option value="" disabled>Pilih kategori bunga</option>
                      {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
                    </select>
                  </label>
                  <div className="admin-form-grid admin-form-grid--product">
                    <label className="admin-form-field">
                      <span>Harga (Rp) <b>*</b></span>
                      <input name="price" type="number" min="0" step="1000" value={form.price} onChange={updateField} required placeholder="0" />
                    </label>
                    <label className="admin-form-field">
                      <span>Stok (rangkaian) <b>*</b></span>
                      <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateField} required placeholder="0" />
                    </label>
                  </div>
                  <div className="admin-product-availability">
                    <span>Ketersediaan <b>*</b></span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Number(form.stock) > 0}
                      aria-label="Ketersediaan produk"
                      className={`admin-stock-toggle${Number(form.stock) > 0 ? ' is-on' : ''}`}
                      onClick={toggleAvailability}
                    />
                    <small>{Number(form.stock) > 0 ? 'Tersedia' : 'Habis'}</small>
                  </div>
                  <label className="admin-form-field">
                    <span>Deskripsi produk</span>
                    <textarea name="description" rows={3} value={form.description} onChange={updateField} maxLength={500} placeholder="Ceritakan jenis bunga, ukuran, dan detail rangkaian..." />
                    <small className="admin-product-editor__hint">Deskripsi ini akan ditampilkan pada kartu bunga di katalog.</small>
                  </label>
                </div>
                <div className="admin-product-editor__photo">
                  <label className="admin-form-field">
                    <span>Foto produk {!item && <b>*</b>}</span>
                  </label>
                  <div
                    className={`admin-upload__dropzone${imagePreview ? ' has-image' : ''}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={dropPhoto}
                  >
                    {imagePreview ? (
                      <img className="admin-upload__preview" src={imagePreview} alt="Pratinjau foto produk" />
                    ) : (
                      <>
                        <span className="admin-upload__icon"><ImagePlus size={20} /></span>
                        <strong>Tarik foto ke sini atau pilih dari perangkat</strong>
                      </>
                    )}
                    <label className="admin-upload__button" htmlFor="admin-product-image">Pilih foto</label>
                    <input
                      id="admin-product-image"
                      className="admin-upload__input"
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={updateField}
                      aria-label="Pilih foto produk"
                      aria-required={!item}
                      aria-describedby={photoError ? 'admin-product-photo-error' : undefined}
                    />
                    <small>JPG, PNG, WEBP, GIF · Maks. 5 MB</small>
                  </div>
                  {photoError && <p className="admin-form-error admin-product-editor__photo-error" id="admin-product-photo-error" role="alert">{photoError}</p>}
                  <p className="admin-product-editor__photo-hint">Gunakan foto persegi dengan cahaya alami agar bunga terlihat jelas.</p>
                </div>
              </div>
              <p className="admin-product-editor__required-note">* Wajib diisi. Pastikan foto, harga, dan stok sesuai sebelum menyimpan.</p>
              <details className="admin-product-extra" open={Boolean(form.badge)}>
                <summary>Atur label katalog (opsional)</summary>
                <label className="admin-form-field">
                  <span>Label produk</span>
                  <input name="badge" value={form.badge} onChange={updateField} maxLength={40} placeholder="Contoh: Terlaris" />
                </label>
              </details>
            </>
          ) : (
            <>
              <label className="admin-form-field">
                <span>Nama kategori <b>*</b></span>
                <input name="name" value={form.name} onChange={updateField} required maxLength={80} />
              </label>
              <label className="admin-form-field">
                <span>Deskripsi</span>
                <textarea name="description" rows={4} value={form.description} onChange={updateField} maxLength={300} />
              </label>
            </>
          )}
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <div className="admin-modal__actions">
            <button type="button" className="admin-secondary-button" onClick={onClose} disabled={saving}>Batal</button>
            <button type="submit" className="admin-primary-button" disabled={saving || (isProduct && !categories.length)}>
              {isProduct && !saving && <Check size={15} />}
              {saving ? 'Menyimpan...' : item ? 'Simpan perubahan' : isProduct ? 'Simpan Produk' : 'Simpan perubahan'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AdminAccountDialog({ admin, saving, error, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    name: admin?.name || '',
    email: admin?.email || '',
    password: '',
  }));

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave({ ...form, password: form.password || undefined });
  }

  return (
    <div className="admin-modal-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className="admin-modal admin-account-modal" role="dialog" aria-modal="true" aria-labelledby="admin-account-title">
        <header className="admin-modal__header">
          <div>
            <p>Akses ruang kelola</p>
            <h2 id="admin-account-title">{admin ? 'Edit admin' : 'Tambah admin'}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Tutup">
            <img src={xClose} alt="" width={19} height={19} />
          </button>
        </header>
        <form className="admin-editor-form" onSubmit={submit}>
          <label className="admin-form-field">
            <span>Nama lengkap <b>*</b></span>
            <input name="name" value={form.name} onChange={updateField} required minLength={2} maxLength={80} autoComplete="name" />
          </label>
          <label className="admin-form-field">
            <span>Email <b>*</b></span>
            <input name="email" type="email" value={form.email} onChange={updateField} required maxLength={254} autoComplete="email" />
          </label>
          <label className="admin-form-field">
            <span>Kata sandi {admin ? '(opsional)' : <b>*</b>}</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              required={!admin}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              placeholder={admin ? 'Kosongkan jika tidak ingin mengganti' : 'Minimal 8 karakter'}
            />
            <small>{admin ? 'Biarkan kosong untuk mempertahankan kata sandi saat ini.' : 'Gunakan minimal 8 karakter.'}</small>
          </label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <div className="admin-modal__actions">
            <button type="button" className="admin-secondary-button" onClick={onClose} disabled={saving}>Batal</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? 'Menyimpan...' : admin ? 'Simpan perubahan' : 'Tambah admin'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AdminSelfSettingsDialog({ admin, mode, saving, error, onSave, onClose }) {
  const [form, setForm] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState('');
  const isPasswordMode = mode === 'password';

  function submit(event) {
    event.preventDefault();
    setValidationError('');
    if (isPasswordMode && form.password !== form.confirmPassword) {
      setValidationError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    onSave(isPasswordMode
      ? { password: form.password }
      : { name: form.name, email: form.email });
  }

  return (
    <div className="admin-modal-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className="admin-modal admin-account-modal" role="dialog" aria-modal="true" aria-labelledby="admin-self-settings-title">
        <header className="admin-modal__header">
          <div>
            <p>Pengaturan akun administrator</p>
            <h2 id="admin-self-settings-title">{isPasswordMode ? 'Ubah kata sandi' : 'Profil admin'}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Tutup">
            <img src={xClose} alt="" width={19} height={19} />
          </button>
        </header>
        <form className="admin-editor-form" onSubmit={submit}>
          {isPasswordMode ? (
            <>
              <label className="admin-form-field">
                <span>Kata sandi baru <b>*</b></span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                />
              </label>
              <label className="admin-form-field">
                <span>Konfirmasi kata sandi baru <b>*</b></span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  placeholder="Ulangi kata sandi baru"
                />
              </label>
            </>
          ) : (
            <>
              <label className="admin-form-field">
                <span>Nama lengkap <b>*</b></span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                />
              </label>
              <label className="admin-form-field">
                <span>Email <b>*</b></span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                  maxLength={254}
                  autoComplete="email"
                />
              </label>
            </>
          )}
          {(validationError || error) && <p className="admin-form-error" role="alert">{validationError || error}</p>}
          <div className="admin-modal__actions">
            <button type="button" className="admin-secondary-button" onClick={onClose} disabled={saving}>Batal</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? 'Menyimpan...' : isPasswordMode ? 'Simpan kata sandi' : 'Simpan profil'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function AdminDashboard({
  user, adminUser,
  settings: publicSettings,
  onExit, onBackToCatalog,
  onLogout,
  onCatalogChanged, onRefreshData, onStoreSettingsChanged,
}) {
  const actualUser = user ?? adminUser;
  const actualOnExit = onExit ?? onBackToCatalog;
  const actualOnCatalogChanged = onCatalogChanged ?? onRefreshData;
  const [profileOverride, setProfileOverride] = useState(null);
  const profile = profileOverride?.id === actualUser?.id ? profileOverride : actualUser;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [productsList, setProducts] = useState([]);
  const [categoriesList, setCategories] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState('');
  const [ordersList, setOrdersList] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [orderActionId, setOrderActionId] = useState('');
  const [adminEditor, setAdminEditor] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [selfSettingsMode, setSelfSettingsMode] = useState('');
  const [selfSettingsSaving, setSelfSettingsSaving] = useState(false);
  const [selfSettingsError, setSelfSettingsError] = useState('');
  const [storeSettings, setStoreSettings] = useState(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeError, setStoreError] = useState('');
  const storeName = storeSettings?.storeName || publicSettings?.storeName || 'Sekar';

  const loadData = useCallback(async () => {
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);
      setPageError('');
      setProducts(productResponse.data);
      setCategories(categoryResponse.data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Data dashboard gagal dimuat.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStoreSettings = useCallback(async () => {
    setStoreLoading(true);
    setStoreError('');
    try {
      const response = await fetchStoreSettings();
      setStoreSettings(response.data);
    } catch (error) {
      setStoreError(error instanceof Error ? error.message : 'Pengaturan toko gagal dimuat.');
    } finally {
      setStoreLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const response = await fetchAdmins();
      setAdminsList(response.data);
      setAdminsError('');
    } catch (error) {
      setAdminsError(error instanceof Error ? error.message : 'Data admin gagal dimuat.');
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const response = await fetchOrders();
      setOrdersList(response.data);
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : 'Daftar pesanan gagal dimuat.');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  async function processOrder(order, status) {
    setOrderActionId(order.id);
    setOrdersError('');
    try {
      await updateOrderStatus(order.id, status);
      setNotificationMessage(status === 'confirmed' ? 'Pesanan berhasil dikonfirmasi.' : 'Pesanan ditolak.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
      await loadOrders();
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : 'Status pesanan gagal diperbarui.');
    } finally {
      setOrderActionId('');
    }
  }

  const availableCount = productsList.filter(isInStock).length;
  const filteredOrders = ordersList.filter(
    (order) => orderStatusFilter === 'all' || order.status === orderStatusFilter,
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    return productsList.filter((product) => {
      const matchesQuery = !query ||
        [product.name, product.categoryName, product.description]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('id-ID')
          .includes(query);
      const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
      const matchesAvailability = availabilityFilter === 'all' ||
        (availabilityFilter === 'available' ? isInStock(product) : !isInStock(product));
      return matchesQuery && matchesCategory && matchesAvailability;
    });
  }, [productsList, search, categoryFilter, availabilityFilter]);
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    if (!query) return categoriesList;
    return categoriesList.filter((category) =>
      [category.name, category.description]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('id-ID')
        .includes(query),
    );
  }, [categoriesList, search]);
  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    if (!query) return adminsList;
    return adminsList.filter((admin) =>
      [admin.name, admin.email]
        .join(' ')
        .toLocaleLowerCase('id-ID')
        .includes(query),
    );
  }, [adminsList, search]);
  const linkedProductCount = productsList.filter((product) =>
    categoriesList.some((category) => category.id === product.categoryId),
  ).length;
  const pendingCategoryProducts = pendingDelete?.type === 'category'
    ? productsList.filter((product) => product.categoryId === pendingDelete.item.id)
    : [];
  const emptyCategoryCount = categoriesList.filter(
    (category) => !productsList.some((product) => product.categoryId === category.id),
  ).length;

  async function saveCurrentEditor(value) {
    setSaving(true);
    setDialogError('');
    try {
      if (editor.type === 'product') {
        await saveProduct(value, editor.item?.id);
      } else {
        await saveCategory(value, editor.item?.id);
      }
      setNotificationMessage(`${editor.type === 'product' ? 'Produk' : 'Kategori'} berhasil ${editor.item ? 'diperbarui' : 'ditambahkan'}.`);
      setEditor(null);
      await loadData();
      actualOnCatalogChanged?.();
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'Perubahan tidak dapat disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    setDialogError('');
    try {
      if (pendingDelete.type === 'product') {
        await deleteProduct(pendingDelete.item.id);
      } else {
        await deleteCategory(pendingDelete.item.id);
      }
      setNotificationMessage(`${pendingDelete.type === 'product' ? 'Produk' : 'Kategori'} berhasil dihapus.`);
      setPendingDelete(null);
      await loadData();
      actualOnCatalogChanged?.();
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'Item tidak dapat dihapus.');
    } finally {
      setSaving(false);
    }
  }

  async function saveCurrentAdmin(value) {
    setSaving(true);
    setDialogError('');
    try {
      const response = await saveAdmin(value, adminEditor?.admin?.id);
      const savedAdmin = response.data;
      if (savedAdmin.id === profile?.id) setProfileOverride(savedAdmin);
      setAdminEditor(null);
      await loadAdmins();
      setNotificationMessage(`Admin berhasil ${adminEditor.admin ? 'diperbarui' : 'ditambahkan'}.`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'Data admin tidak dapat disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteAdmin() {
    if (!adminToDelete) return;
    setSaving(true);
    setDialogError('');
    try {
      await deleteAdmin(adminToDelete.id);
      setAdminToDelete(null);
      await loadAdmins();
      setNotificationMessage('Admin berhasil dihapus.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'Admin tidak dapat dihapus.');
    } finally {
      setSaving(false);
    }
  }

  async function saveSelfSettings(values) {
    if (!profile?.id) return;
    setSelfSettingsSaving(true);
    setSelfSettingsError('');
    try {
      const response = await saveAdmin({
        name: values.name ?? profile.name,
        email: values.email ?? profile.email,
        ...(values.password ? { password: values.password } : {}),
      }, profile.id);
      setProfileOverride(response.data);
      setSelfSettingsMode('');
      setNotificationMessage(values.password ? 'Kata sandi admin berhasil diubah.' : 'Profil admin berhasil diperbarui.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    } catch (error) {
      setSelfSettingsError(error instanceof Error ? error.message : 'Pengaturan akun tidak dapat disimpan.');
    } finally {
      setSelfSettingsSaving(false);
    }
  }

  async function saveStoreSection(event, section) {
    event.preventDefault();
    if (!storeSettings) return;

    const values = section === 'store'
      ? {
          storeName: storeSettings.storeName,
          tagline: storeSettings.tagline,
          address: storeSettings.address,
        }
      : {
          phone: storeSettings.phone,
          activeWhatsApp: storeSettings.activeWhatsApp,
        };

    setStoreSaving(true);
    setStoreError('');
    try {
      const response = await saveStoreSettings(values);
      setStoreSettings(response.data);
      onStoreSettingsChanged?.(response.data);
      setNotificationMessage(
        section === 'store'
          ? 'Informasi toko berhasil disimpan.'
          : 'Pengaturan WhatsApp berhasil disimpan.',
      );
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    } catch (error) {
      setStoreError(error instanceof Error ? error.message : 'Pengaturan tidak dapat disimpan.');
    } finally {
      setStoreSaving(false);
    }
  }

  async function changeStock(product) {
    try {
      await toggleProductStock(product.id);
      setNotificationMessage(`Stok ${product.name} berhasil diperbarui.`);
      await loadData();
      actualOnCatalogChanged?.();
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Stok produk gagal diperbarui.');
    }
  }

  function openEditor(type, item = null) {
    setDialogError('');
    setEditor({ type, item });
  }

  function openDelete(type, item) {
    setDialogError(
      type === 'category' && productsList.some((product) => product.categoryId === item.id)
        ? 'Kategori ini masih memiliki produk. Pindahkan produk ke kategori lain sebelum menghapusnya.'
        : '',
    );
    setPendingDelete({ type, item });
  }

  function manageCategoryProducts() {
    if (pendingDelete?.type !== 'category') return;
    setActiveTab('products');
    setCategoryFilter(pendingDelete.item.id);
    setSearch('');
    setPendingDelete(null);
    setDialogError('');
  }

  const dummyProducts = [
    {
      id: 1, foto: fotoBunga0, nama: 'Senandung Mawar',
      deskripsi: '12 mawar pink · eucalyptus', kategori: 'Buket bunga',
      harga: 'Rp249.000', stok: '12', status: 'Tersedia', statusColor: '#0f2f22',
      toggle: sakelarStok, aksi1: ikon4, aksi2: ikon5,
    },
    {
      id: 2, foto: fotoBunga1, nama: 'Sinar Pagi',
      deskripsi: '5 sunflower · aster putih', kategori: 'Buket bunga',
      harga: 'Rp189.000', stok: '8', status: 'Tersedia', statusColor: '#0f2f22',
      toggle: sakelarStok, aksi1: ikon4, aksi2: ikon5,
    },
    {
      id: 3, foto: fotoBunga2, nama: 'Peluk dalam Bunga',
      deskripsi: 'Mawar, lisianthus · box medium', kategori: 'Flower box',
      harga: 'Rp349.000', stok: '6', status: 'Tersedia', statusColor: '#0f2f22',
      toggle: sakelarStok, aksi1: ikon4, aksi2: ikon5,
    },
    {
      id: 4, foto: fotoBunga3, nama: 'Tulip untukmu',
      deskripsi: '10 tulip pink · wrapping premium', kategori: 'Buket bunga',
      harga: 'Rp329.000', stok: '0', status: 'Habis', statusColor: '#7b847a',
      toggle: sakelarStok1, aksi1: ikon4, aksi2: ikon5,
    },
    {
      id: 5, foto: fotoBunga4, nama: 'Putih yang Tulus',
      deskripsi: 'Lily putih · vas kaca termasuk', kategori: 'Bunga meja',
      harga: 'Rp299.000', stok: '5', status: 'Tersedia', statusColor: '#0f2f22',
      toggle: sakelarStok, aksi1: ikon4, aksi2: ikon5,
    },
    {
      id: 6, foto: fotoBunga5, nama: 'Rona Senja',
      deskripsi: 'Mawar peach, carnation · medium', kategori: 'Buket bunga',
      harga: 'Rp279.000', stok: '9', status: 'Tersedia', statusColor: '#0f2f22',
      toggle: sakelarStok, aksi1: ikon4, aksi2: ikon5,
    },
    {
      id: 7, foto: fotoBunga6, nama: 'Abadi dalam Rasa',
      deskripsi: 'Pampas, bunny tail · tahan lama', kategori: 'Bunga kering',
      harga: 'Rp149.000', stok: '15', status: 'Tersedia', statusColor: '#0f2f22',
      toggle: sakelarStok, aksi1: ikon4, aksi2: ikon5,
    },
    {
      id: 8, foto: fotoBunga7, nama: 'Taman Kecil',
      deskripsi: 'Mixed seasonal flowers · keranjang', kategori: 'Flower basket',
      harga: 'Rp429.000', stok: '0', status: 'Habis', statusColor: '#7b847a',
      toggle: sakelarStok1, aksi1: ikon4, aksi2: ikon5,
    },
  ];
  const pendingProduct = pendingDelete?.type === 'product' ? pendingDelete.item : null;
  const pendingProductDummy = pendingProduct
    ? dummyProducts.find((sample) => sample.nama === pendingProduct.name)
    : null;
  const pendingProductImage = pendingProduct?.image && !pendingProduct.image.startsWith('/images/')
    ? getImageSource(pendingProduct.image)
    : pendingProductDummy?.foto || getImageSource(pendingProduct?.image);
  const pendingProductCategory = pendingProduct?.categoryName ||
    categoriesList.find((category) => category.id === pendingProduct?.categoryId)?.name ||
    'Belum ada kategori';

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand" onClick={actualOnExit} style={{ cursor: 'pointer' }}>
          <img src={lambangBunga} alt="Lambang bunga" width={20} height={29} />
          <span>{storeName.toLowerCase()}.</span>
        </div>
        <p className="admin-sidebar__label">RUANG KELOLA {storeName.toLocaleUpperCase('id-ID')}</p>
        <nav className="admin-sidebar__nav" aria-label="Menu admin">
          <button type="button" className={activeTab === 'dashboard' ? 'is-active' : ''} onClick={() => setActiveTab('dashboard')}>
            <img src={ikon} alt="Ikon" width={18} height={18} /> Kelola produk
          </button>
          <button type="button" className={activeTab === 'categories' ? 'is-active' : ''} onClick={() => setActiveTab('categories')}>
            <img src={layers} alt="Layers" width={18} height={18} /> Kelola kategori
          </button>
          <button type="button" className={activeTab === 'orders' ? 'is-active' : ''} onClick={() => {
            setActiveTab('orders');
            loadOrders();
          }}>
            <ClipboardList size={18} aria-hidden="true" /> Pesanan
          </button>
          <button type="button" className={activeTab === 'admins' ? 'is-active' : ''} onClick={() => {
            setActiveTab('admins');
            loadAdmins();
          }}>
            <UserRound size={18} aria-hidden="true" /> Kelola admin
          </button>
          <button type="button" className={activeTab === 'store' ? 'is-active' : ''} onClick={() => {
            setActiveTab('store');
            loadStoreSettings();
          }}>
            <Store size={18} aria-hidden="true" /> Kelola toko
          </button>
          <button type="button" className={activeTab === 'whatsapp' ? 'is-active' : ''} onClick={() => {
            setActiveTab('whatsapp');
            loadStoreSettings();
          }}>
            <MessageCircle size={18} aria-hidden="true" /> Kelola WhatsApp
          </button>
        </nav>
        <div className="admin-sidebar__bottom">
          <div className="admin-sidebar__help-card">
            <button
              className="admin-sidebar__help admin-sidebar__help--link"
              type="button"
              onClick={actualOnExit}
              aria-label={`Lihat katalog ${storeName}`}
            >
              <span className="admin-sidebar__help-icon">
                <img src={store} alt="" width={18} height={18} />
              </span>
              <span className="admin-sidebar__help-copy">
                <span className="admin-sidebar__help-title">Katalog siap menyapa.</span>
                <span className="admin-sidebar__help-desc">Lihat tampilan bunga yang dilihat pelangganmu.</span>
                <span className="admin-sidebar__help-link">Lihat katalog <ArrowRight size={14} aria-hidden="true" /></span>
              </span>
            </button>
          </div>
          <button className="admin-sidebar__logout" type="button" onClick={onLogout}>
            <img src={logOut} alt="Log out" width={18} height={18} /> Keluar
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>Panel admin</span> <span>/</span> <strong>{activeTab === 'categories' ? 'Kelola kategori' : activeTab === 'orders' ? 'Pesanan' : activeTab === 'admins' ? 'Kelola admin' : activeTab === 'store' ? 'Kelola toko' : activeTab === 'whatsapp' ? 'Kelola WhatsApp' : 'Kelola produk'}</strong>
          </div>
          <div className="admin-topbar__right">
            <div className="admin-account-menu">
              <button
                className="admin-account-menu__trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-label={`Menu akun ${profile?.name || `Admin ${storeName}`}`}
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                <div className="admin-sidebar__profile">
                  <div className="admin-avatar">
                    {(profile?.name || 'A').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <strong>{profile?.name || `Admin ${storeName}`}</strong>
                    <small>Administrator</small>
                  </div>
                </div>
              </button>
              {accountMenuOpen && (
                <div className="admin-account-menu__panel" role="menu" aria-label="Tindakan akun admin">
                  <button type="button" role="menuitem" onClick={() => {
                    setSelfSettingsError('');
                    setSelfSettingsMode('profile');
                    setAccountMenuOpen(false);
                  }}>
                    <UserRound size={16} /> Profil admin
                  </button>
                  <button type="button" role="menuitem" onClick={() => {
                    setSelfSettingsError('');
                    setSelfSettingsMode('password');
                    setAccountMenuOpen(false);
                  }}>
                    <KeyRound size={16} /> Ubah kata sandi
                  </button>
                  <button type="button" role="menuitem" onClick={onLogout}>
                    <img src={logOut} alt="" width={16} height={16} /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-page-top">
            <div className="admin-page-heading">
              <p className="admin-eyebrow">RUANG KERJA {storeName.toLocaleUpperCase('id-ID')}</p>
              <h1>{activeTab === 'categories' ? 'Kelola kategori' : activeTab === 'orders' ? 'Pesanan pelanggan' : activeTab === 'admins' ? 'Kelola admin' : activeTab === 'store' ? 'Kelola toko' : activeTab === 'whatsapp' ? 'Kelola WhatsApp' : 'Kelola katalog bunga'}</h1>
              <p>{activeTab === 'categories' ? 'Bantu pelanggan menemukan bunga yang mereka cari.' : activeTab === 'orders' ? 'Tinjau dan konfirmasi pesanan yang dikirim dari akun pelanggan.' : activeTab === 'admins' ? `Atur akun yang memiliki akses ke ruang kelola ${storeName}.` : activeTab === 'store' ? 'Atur identitas dan informasi yang ditampilkan di katalog.' : activeTab === 'whatsapp' ? 'Atur nomor kontak dan ketersediaan pesanan melalui WhatsApp.' : 'Rawat setiap rangkaian, dari harga hingga ketersediaan.'}</p>
            </div>
            {activeTab === 'admins' ? (
              <button className="admin-primary-button" type="button" onClick={() => {
                setDialogError('');
                setAdminEditor({ admin: null });
              }}>
                <img src={plus} alt="" width={18} height={18} /> Tambah Admin
              </button>
            ) : activeTab === 'categories' || activeTab === 'dashboard' ? (
              <button className="admin-primary-button" type="button" onClick={() => openEditor(activeTab === 'categories' ? 'category' : 'product')}>
                <img src={plus} alt="" width={18} height={18} /> Tambah {activeTab === 'categories' ? 'Kategori' : 'Produk'}
              </button>
            ) : null}
          </div>

          {pageError && (
            <div className="admin-notice admin-notice--error" role="alert">
              {pageError}
              <button type="button" onClick={loadData}>Coba lagi</button>
            </div>
          )}

          <div className="admin-stat-grid">
            {activeTab === 'orders' ? (
              <>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Total pesanan</span><ClipboardList size={19} /></div><strong>{ordersList.length}</strong><small>Pesanan akun pelanggan</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Menunggu konfirmasi</span><Check size={19} /></div><strong>{ordersList.filter((order) => order.status === 'pending').length}</strong><small>Perlu ditinjau</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Dikonfirmasi</span><ShieldCheck size={19} /></div><strong>{ordersList.filter((order) => order.status === 'confirmed').length}</strong><small>Siap diproses toko</small></div>
              </>
            ) : activeTab === 'store' ? (
              <>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Nama toko</span><Store size={19} /></div><strong>{storeSettings?.storeName || '—'}</strong><small>Ditampilkan di katalog</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Slogan toko</span><Check size={19} /></div><strong>{storeSettings?.tagline || publicSettings?.tagline ? 'Diatur' : 'Belum diatur'}</strong><small>Identitas toko {storeName}</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Alamat</span><MapPin size={19} /></div><strong>{storeSettings?.address ? 'Diatur' : 'Belum diatur'}</strong><small>Lokasi pada katalog toko</small></div>
              </>
            ) : activeTab === 'whatsapp' ? (
              <>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Status WhatsApp</span><MessageCircle size={19} /></div><strong>{storeSettings?.activeWhatsApp ? 'Aktif' : 'Nonaktif'}</strong><small>Kontak pesanan di katalog</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Nomor kontak</span><Phone size={19} /></div><strong>{storeSettings?.phone || '—'}</strong><small>Nomor tujuan pesanan</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Format kontak</span><ShieldCheck size={19} /></div><strong>WhatsApp</strong><small>Pesanan dikirim langsung ke nomor toko</small></div>
              </>
            ) : activeTab === 'admins' ? (
              <>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Total admin</span><UserRound size={19} /></div><strong>{adminsList.length}</strong><small>Akun dengan akses kelola</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Akun Anda</span><ShieldCheck size={19} /></div><strong>Aktif</strong><small>{profile?.email || 'Administrator'}</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Keamanan akun</span><ShieldCheck size={19} /></div><strong>Terjaga</strong><small>Kata sandi tersimpan dengan aman</small></div>
              </>
            ) : activeTab === 'categories' ? (
              <>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Total kategori</span><img src={layers} alt="" width={19} height={19} /></div><strong>{categoriesList.length}</strong><small>Semua kategori terisi</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Produk terhubung</span><img src={circleCheck} alt="" width={19} height={19} /></div><strong>{linkedProductCount}</strong><small>Tersebar di {categoriesList.length} kategori</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Kategori tanpa produk</span><img src={packageImg} alt="" width={19} height={19} /></div><strong>{emptyCategoryCount}</strong><small>Katalog tertata rapi</small></div>
              </>
            ) : (
              <>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Total produk</span><img src={ikon} alt="" width={19} height={19} /></div><strong>{productsList.length}</strong><small>Rangkaian dalam katalog</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Produk tersedia</span><img src={circleCheck} alt="" width={19} height={19} /></div><strong>{availableCount}</strong><small>Siap menerima pesanan</small></div>
                <div className="admin-stat-card"><div className="admin-stat-card__top"><span>Produk habis</span><img src={packageImg} alt="" width={19} height={19} /></div><strong>{productsList.length - availableCount}</strong><small>Perlu pembaruan stok</small></div>
              </>
            )}
          </div>

          {activeTab === 'orders' ? (
            <div className="admin-panel">
              <div className="admin-panel__heading">
                <div><h2>Daftar pesanan</h2><p>Pesanan akun pelanggan akan tampil di sini setelah checkout melalui WhatsApp.</p></div>
                <div className="admin-order-controls">
                  <label className="admin-order-filter">
                    <span>Filter status</span>
                    <select
                      value={orderStatusFilter}
                      onChange={(event) => setOrderStatusFilter(event.target.value)}
                      aria-label="Filter pesanan berdasarkan status"
                    >
                      <option value="all">Semua status</option>
                      <option value="pending">Menunggu konfirmasi</option>
                      <option value="confirmed">Dikonfirmasi</option>
                      <option value="rejected">Ditolak</option>
                    </select>
                  </label>
                  <button className="admin-secondary-button" type="button" onClick={loadOrders} disabled={ordersLoading}>
                    {ordersLoading ? 'Memuat...' : 'Muat ulang'}
                  </button>
                </div>
              </div>
              {ordersError && (
                <div className="admin-notice admin-notice--error" role="alert">
                  {ordersError}
                  <button type="button" onClick={loadOrders}>Coba lagi</button>
                </div>
              )}
              {ordersLoading ? (
                <div className="admin-empty">Memuat daftar pesanan...</div>
              ) : ordersList.length ? filteredOrders.length ? (
                <div className="admin-order-list">
                  {filteredOrders.map((order) => (
                    <article className="admin-order-card" key={order.id}>
                      <header className="admin-order-card__header">
                        <div>
                          <strong>Pesanan #{order.id.slice(0, 8).toUpperCase()}</strong>
                          <small>{formatOrderDate(order.createdAt)}</small>
                        </div>
                        <span className={`user-order-status user-order-status--${order.status}`}>
                          {order.status === 'confirmed' ? 'Dikonfirmasi' : order.status === 'rejected' ? 'Ditolak' : 'Menunggu konfirmasi'}
                        </span>
                      </header>
                      <div className="admin-order-card__customer">
                        <strong>{order.customerName}</strong>
                        <a href={`mailto:${encodeURIComponent(order.customerEmail)}`}>{order.customerEmail}</a>
                      </div>
                      <p className="admin-order-card__delivery">
                        {order.deliveryMethod === 'pickup' ? <MapPin size={16} /> : <Truck size={16} />}
                        {order.deliveryMethod === 'pickup' ? 'Ambil di studio' : 'Kirim ke alamat'}
                      </p>
                      {order.address && <p className="admin-order-card__address">{order.address}</p>}
                      <ul className="admin-order-card__items">
                        {order.items.map((item) => (
                          <li key={item.productId}>
                            <span>{item.name} × {item.quantity}</span>
                            <strong>{formatPrice(item.lineTotal)}</strong>
                          </li>
                        ))}
                      </ul>
                      {order.note && <p className="admin-order-card__note"><strong>Catatan:</strong> {order.note}</p>}
                      <footer className="admin-order-card__footer">
                        <div><span>Total pesanan</span><strong>{formatPrice(order.subtotal)}</strong></div>
                        {order.status === 'pending' && (
                          <div className="admin-order-card__actions">
                            <button
                              className="admin-secondary-button"
                              type="button"
                              disabled={orderActionId === order.id}
                              onClick={() => processOrder(order, 'rejected')}
                            >
                              Tolak
                            </button>
                            <button
                              className="admin-primary-button"
                              type="button"
                              disabled={orderActionId === order.id}
                              onClick={() => processOrder(order, 'confirmed')}
                            >
                              {orderActionId === order.id ? 'Memproses...' : 'Konfirmasi pesanan'}
                            </button>
                          </div>
                        )}
                      </footer>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-empty">Tidak ada pesanan dengan status yang dipilih.</div>
              ) : (
                <div className="admin-empty">Belum ada pesanan dari akun pelanggan.</div>
              )}
            </div>
          ) : activeTab === 'store' ? (
            <div className="admin-panel">
              <div className="admin-panel__heading">
                <div><h2>Informasi toko</h2><p>Informasi ini digunakan pada halaman katalog dan kontak toko.</p></div>
                <Store size={20} aria-hidden="true" />
              </div>
              {storeError && (
                <div className="admin-notice admin-notice--error" role="alert">
                  {storeError}
                  <button type="button" onClick={loadStoreSettings}>Coba lagi</button>
                </div>
              )}
              {storeLoading || !storeSettings ? (
                <div className="admin-empty">{storeLoading ? 'Memuat pengaturan toko...' : 'Pengaturan toko belum tersedia.'}</div>
              ) : (
                <form className="admin-editor-form admin-settings-form" onSubmit={(event) => saveStoreSection(event, 'store')}>
                  <label className="admin-form-field">
                    <span>Nama toko <b>*</b></span>
                    <input
                      name="storeName"
                      value={storeSettings.storeName}
                      onChange={(event) => setStoreSettings((current) => ({ ...current, storeName: event.target.value }))}
                      required
                      maxLength={80}
                      autoComplete="organization"
                    />
                    <small>Nama ini akan tampil pada header dan footer katalog.</small>
                  </label>
                  <label className="admin-form-field">
                    <span>Slogan toko</span>
                    <input
                      name="tagline"
                      value={storeSettings.tagline}
                      onChange={(event) => setStoreSettings((current) => ({ ...current, tagline: event.target.value }))}
                      maxLength={160}
                      placeholder="Contoh: Bunga pilihan untuk setiap cerita"
                    />
                  </label>
                  <label className="admin-form-field">
                    <span>Alamat toko</span>
                    <textarea
                      name="address"
                      value={storeSettings.address}
                      onChange={(event) => setStoreSettings((current) => ({ ...current, address: event.target.value }))}
                      maxLength={240}
                      rows={3}
                      placeholder="Alamat yang ditampilkan kepada pelanggan"
                    />
                    <small>Alamat ini juga digunakan untuk tautan lokasi toko di peta.</small>
                  </label>
                  <div className="admin-settings-form__actions">
                    <button className="admin-primary-button" type="submit" disabled={storeSaving}>
                      {storeSaving ? 'Menyimpan...' : 'Simpan informasi toko'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : activeTab === 'whatsapp' ? (
            <div className="admin-panel">
              <div className="admin-panel__heading">
                <div><h2>Kontak WhatsApp</h2><p>Atur tujuan pesan konsultasi dan pesanan dari katalog.</p></div>
                <MessageCircle size={20} aria-hidden="true" />
              </div>
              {storeError && (
                <div className="admin-notice admin-notice--error" role="alert">
                  {storeError}
                  <button type="button" onClick={loadStoreSettings}>Coba lagi</button>
                </div>
              )}
              {storeLoading || !storeSettings ? (
                <div className="admin-empty">{storeLoading ? 'Memuat pengaturan WhatsApp...' : 'Pengaturan WhatsApp belum tersedia.'}</div>
              ) : (
                <form className="admin-editor-form admin-settings-form" onSubmit={(event) => saveStoreSection(event, 'whatsapp')}>
                  <label className="admin-form-field">
                    <span>Nomor WhatsApp toko</span>
                    <input
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      value={storeSettings.phone}
                      onChange={(event) => setStoreSettings((current) => ({ ...current, phone: event.target.value }))}
                      maxLength={24}
                      autoComplete="tel"
                      placeholder="Contoh: 081234567890"
                    />
                    <small>Gunakan nomor aktif, dengan kode negara (62) atau awalan 0. Nomor ini menerima pesan pesanan.</small>
                  </label>
                  <div className="admin-settings-whatsapp-status">
                    <div>
                      <strong>Terima pesanan melalui WhatsApp</strong>
                      <small>{storeSettings.activeWhatsApp ? 'Tombol WhatsApp tampil dan dapat digunakan pelanggan.' : 'Tombol WhatsApp dinonaktifkan pada katalog.'}</small>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={storeSettings.activeWhatsApp}
                      aria-label="Aktifkan pesanan WhatsApp"
                      className={`admin-stock-toggle${storeSettings.activeWhatsApp ? ' is-on' : ''}`}
                      onClick={() => setStoreSettings((current) => ({ ...current, activeWhatsApp: !current.activeWhatsApp }))}
                    />
                  </div>
                  <div className="admin-settings-form__actions">
                    <button className="admin-primary-button" type="submit" disabled={storeSaving}>
                      {storeSaving ? 'Menyimpan...' : 'Simpan pengaturan WhatsApp'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : activeTab === 'admins' ? (
            <div className="admin-panel">
              <div className="admin-panel__heading">
                <div><h2>Daftar admin</h2><p>Kelola akun yang dapat masuk ke panel admin.</p></div>
                <div className="admin-search">
                  <img src={ikon2} alt="" width={16} height={16} />
                  <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email..." aria-label="Cari admin" />
                </div>
              </div>
              {adminsError && (
                <div className="admin-notice admin-notice--error" role="alert">
                  {adminsError}
                  <button type="button" onClick={loadAdmins}>Coba lagi</button>
                </div>
              )}
              {adminsLoading ? (
                <div className="admin-empty">Memuat data admin...</div>
              ) : filteredAdmins.length ? (
                <div className="admin-table-scroll">
                  <table className="admin-table admin-account-table">
                    <thead><tr><th>ADMIN</th><th>EMAIL</th><th>TANGGAL DITAMBAHKAN</th><th>AKSI</th></tr></thead>
                    <tbody>
                      {filteredAdmins.map((admin) => {
                        const isCurrentAdmin = admin.id === profile?.id;
                        return (
                          <tr key={admin.id}>
                            <td>
                              <div className="admin-account-name">
                                <span className="admin-avatar">{(admin.name || 'A').slice(0, 1).toUpperCase()}</span>
                                <span><strong>{admin.name}</strong>{isCurrentAdmin && <small>Akun Anda</small>}</span>
                              </div>
                            </td>
                            <td>{admin.email}</td>
                            <td>{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('id-ID') : '—'}</td>
                            <td>
                              <div className="admin-row-actions">
                                <button type="button" title={`Edit ${admin.name}`} aria-label={`Edit ${admin.name}`} onClick={() => {
                                  setDialogError('');
                                  setAdminEditor({ admin });
                                }}><img src={ikon4} alt="" width={16} height={16} /></button>
                                <button
                                  type="button"
                                  title={isCurrentAdmin ? 'Akun yang sedang digunakan tidak dapat dihapus' : adminsList.length === 1 ? 'Minimal satu admin harus dipertahankan' : `Hapus ${admin.name}`}
                                  aria-label={`Hapus ${admin.name}`}
                                  disabled={isCurrentAdmin || adminsList.length <= 1}
                                  onClick={() => {
                                    setDialogError('');
                                    setAdminToDelete(admin);
                                  }}
                                ><img src={ikon5} alt="" width={16} height={16} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="admin-table-footer">Menampilkan {filteredAdmins.length} dari {adminsList.length} admin.</div>
                </div>
              ) : (
                <div className="admin-empty">{adminsList.length ? 'Admin tidak ditemukan.' : 'Belum ada admin.'}</div>
              )}
              <p className="admin-category-note"><ShieldCheck size={15} /> Kata sandi admin dienkripsi dan tidak pernah ditampilkan. Akun yang sedang digunakan tidak dapat dihapus.</p>
            </div>
          ) : activeTab === 'categories' ? (
            <div className="admin-panel">
              <div className="admin-panel__heading">
                <div><h2>Semua kategori</h2><p>Kelola kategori yang tampil sebagai filter katalog.</p></div>
                <div className="admin-search">
                  <img src={ikon2} alt="" width={16} height={16} />
                  <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama kategori..." aria-label="Cari kategori" />
                </div>
              </div>
              {isLoading ? (
                <div className="admin-empty">Memuat data katalog...</div>
              ) : filteredCategories.length ? (
                <div className="admin-table-scroll">
                  <table className="admin-table admin-category-table">
                    <thead><tr><th>NAMA KATEGORI</th><th>DESKRIPSI</th><th>JUMLAH PRODUK</th><th>AKSI</th></tr></thead>
                    <tbody>
                      {filteredCategories.map((category) => {
                        const productCount = productsList.filter((product) => product.categoryId === category.id).length;
                        return (
                          <tr key={category.id}>
                            <td><div className="admin-category-name"><span><img src={lambangBunga} alt="" width={16} height={21} /></span><strong>{category.name}</strong></div></td>
                            <td>{category.description || 'Belum ada deskripsi.'}</td>
                            <td>{productCount} produk</td>
                            <td><div className="admin-row-actions">
                              <button type="button" title="Edit kategori" onClick={() => openEditor('category', category)}><img src={ikon4} alt="" width={16} height={16} /></button>
                              <button type="button" title="Hapus kategori" onClick={() => openDelete('category', category)}><img src={ikon5} alt="" width={16} height={16} /></button>
                            </div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="admin-table-footer">Menampilkan {filteredCategories.length} dari {categoriesList.length} kategori · {linkedProductCount} produk terhubung</div>
                </div>
              ) : (
                <div className="admin-empty">{categoriesList.length ? 'Kategori tidak ditemukan.' : 'Belum ada kategori.'}</div>
              )}
              <p className="admin-category-note"><img src={ikon3} alt="" width={15} height={15} /> Nama kategori tampil di filter katalog. Pindahkan produk terlebih dahulu sebelum menghapus kategori yang masih digunakan.</p>
            </div>
          ) : (
            <div className="admin-panel">
              <div className="admin-panel__heading">
                <div><h2>Katalog produk</h2><p>Kelola rangkaian, harga, stok, dan ketersediaan produk.</p></div>
                <span className="admin-product-count">{filteredProducts.length} dari {productsList.length} produk</span>
              </div>
              <div className="admin-product-toolbar">
                <div className="admin-product-toolbar__search admin-search">
                  <img src={ikon2} alt="" width={16} height={16} />
                  <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau deskripsi produk..." aria-label="Cari produk" />
                </div>
                <div className="admin-product-filters">
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter kategori">
                    <option value="all">Semua kategori</option>
                    {categoriesList.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
                  </select>
                  <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)} aria-label="Filter ketersediaan">
                    <option value="all">Semua status</option>
                    <option value="available">Tersedia</option>
                    <option value="sold-out">Habis</option>
                  </select>
                </div>
              </div>
              {isLoading ? (
                <div className="admin-empty">Memuat data katalog...</div>
              ) : filteredProducts.length ? (
                <div className="admin-table-scroll admin-table-scroll--products">
                  <table className="admin-table admin-product-table">
                    <thead><tr><th>PRODUK</th><th>KATEGORI</th><th>HARGA</th><th>STOK</th><th>KETERSEDIAAN</th><th>AKSI</th></tr></thead>
                    <tbody>
                      {filteredProducts.map((produk, index) => {
                        const dummy = dummyProducts.find((sample) => sample.nama === produk.name);
                        const categoryName = produk.categoryName || categoriesList.find((category) => category.id === produk.categoryId)?.name || '—';
                        const image = produk.image && !produk.image.startsWith('/images/')
                          ? getImageSource(produk.image)
                          : dummy?.foto || getImageSource(produk.image);
                        return (
                          <tr key={produk.id || index}>
                            <td><div className="admin-product-cell">
                              {image
                                ? <img src={image} alt="" width={44} height={44} className="admin-product-img" />
                                : <span className="admin-product-img-placeholder"><Flower2 size={18} /></span>}
                              <span className="admin-product-cell__copy"><strong>{produk.name}</strong><small>{produk.description || 'Belum ada deskripsi produk.'}</small></span>
                            </div></td>
                            <td><span className="admin-product-category">{categoryName}</span></td>
                            <td className="admin-price">{formatPrice(produk.price)}</td>
                            <td><span className={`admin-product-stock${Number(produk.stock) === 0 ? ' is-empty' : ''}`}>{Number(produk.stock) || 0}<small> rangkaian</small></span></td>
                            <td><div className="admin-ketersediaan">
                              <button
                                className={`admin-stock-toggle ${isInStock(produk) ? 'is-on' : ''}`}
                                type="button"
                                role="switch"
                                aria-checked={isInStock(produk)}
                                onClick={() => changeStock(produk)}
                                aria-label={`Ubah ketersediaan ${produk.name}`}
                              />
                              <span className={`admin-product-status${isInStock(produk) ? ' is-available' : ''}`}>{isInStock(produk) ? 'Tersedia' : 'Habis'}</span>
                            </div></td>
                            <td><div className="admin-row-actions">
                              <button type="button" title="Edit produk" aria-label={`Edit ${produk.name}`} onClick={() => openEditor('product', produk)}><img src={ikon4} alt="" width={16} height={16} /></button>
                              <button type="button" title="Hapus produk" aria-label={`Hapus ${produk.name}`} onClick={() => openDelete('product', produk)}><img src={ikon5} alt="" width={16} height={16} /></button>
                            </div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="admin-table-footer">Menampilkan {filteredProducts.length} produk dalam katalog {storeName}.</div>
                </div>
              ) : (
                <div className="admin-empty">{productsList.length ? 'Produk tidak ditemukan.' : 'Belum ada produk.'}</div>
              )}
            </div>
          )}

          <p className="admin-content__footnote">Katalog {storeName} diperbarui otomatis saat Anda menyimpan perubahan.</p>
        </div>
      </main>

      {editor && (
        <AdminEditorDialog
          key={`${editor.type}-${editor.item?.id || 'new'}`}
          type={editor.type}
          item={editor.item}
          categories={categoriesList}
          storeName={storeName}
          saving={saving}
          error={dialogError}
          onSave={saveCurrentEditor}
          onClose={() => {
            if (!saving) {
              setEditor(null);
              setDialogError('');
            }
          }}
        />
      )}

      {adminEditor && (
        <AdminAccountDialog
          key={adminEditor.admin?.id || 'new-admin'}
          admin={adminEditor.admin}
          saving={saving}
          error={dialogError}
          onSave={saveCurrentAdmin}
          onClose={() => {
            if (!saving) {
              setAdminEditor(null);
              setDialogError('');
            }
          }}
        />
      )}

      {selfSettingsMode && (
        <AdminSelfSettingsDialog
          key={selfSettingsMode}
          admin={profile}
          mode={selfSettingsMode}
          saving={selfSettingsSaving}
          error={selfSettingsError}
          onSave={saveSelfSettings}
          onClose={() => {
            if (!selfSettingsSaving) {
              setSelfSettingsMode('');
              setSelfSettingsError('');
            }
          }}
        />
      )}

      {adminToDelete && (
        <div className="admin-modal-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) {
            setAdminToDelete(null);
            setDialogError('');
          }
        }}>
          <section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-delete-account-title">
            <header className="admin-modal__header">
              <div>
                <p>Pengelolaan akses</p>
                <h2 id="admin-delete-account-title">Hapus admin ini?</h2>
              </div>
              <button type="button" onClick={() => setAdminToDelete(null)} disabled={saving} aria-label="Tutup">
                <img src={xClose} alt="" width={19} height={19} />
              </button>
            </header>
            <p className="admin-confirm-modal__text">
              Akun <strong>{adminToDelete.name}</strong> ({adminToDelete.email}) akan dihapus dan tidak dapat digunakan untuk masuk kembali.
            </p>
            {dialogError && <p className="admin-form-error" role="alert">{dialogError}</p>}
            <div className="admin-modal__actions">
              <button type="button" className="admin-secondary-button" onClick={() => {
                setAdminToDelete(null);
                setDialogError('');
              }} disabled={saving}>Batal</button>
              <button type="button" className="admin-danger-button" onClick={confirmDeleteAdmin} disabled={saving}>
                {saving ? 'Menghapus...' : 'Hapus Admin'}
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingDelete && (
        <div className="admin-modal-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) {
            setPendingDelete(null);
            setDialogError('');
          }
        }}>
          <section
            className={`admin-confirm-modal${pendingDelete.type === 'category' ? ' admin-category-delete-modal' : ' admin-product-delete-modal'}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-delete-title"
          >
            {pendingDelete.type === 'category' ? (
              <>
                <header className="admin-category-delete-modal__header">
                  <div>
                    <h2 id="admin-delete-title">Hapus kategori {pendingDelete.item.name}?</h2>
                    <p>Kategori ini masih digunakan oleh {pendingCategoryProducts.length} produk.</p>
                  </div>
                  <button
                    type="button"
                    className="admin-category-delete-modal__close"
                    aria-label="Tutup"
                    onClick={() => {
                      setPendingDelete(null);
                      setDialogError('');
                    }}
                    disabled={saving}
                  >
                    <img src={xClose} alt="" width={18} height={18} />
                  </button>
                </header>
                <div className="admin-category-delete-modal__body">
                  {pendingCategoryProducts.length > 0 && (
                    <>
                      <div className="admin-category-delete-modal__warning" role="note">
                        <AlertTriangle size={15} />
                        <span>Kategori belum dapat dihapus. Pindahkan semua produk ke kategori lain terlebih dahulu agar tidak ada bunga yang kehilangan kategorinya.</span>
                      </div>
                      <h3>Produk yang perlu dipindahkan</h3>
                      <ul className="admin-category-delete-modal__products">
                        {pendingCategoryProducts.map((product) => {
                          const dummy = dummyProducts.find((sample) => sample.nama === product.name);
                          const image = product.image && !product.image.startsWith('/images/')
                            ? getImageSource(product.image)
                            : dummy?.foto || getImageSource(product.image);
                          return (
                            <li key={product.id}>
                              {image ? <img src={image} alt="" /> : <span className="admin-category-delete-modal__product-placeholder"><Flower2 size={16} /></span>}
                              <span className="admin-category-delete-modal__product-name">{product.name}</span>
                              <span className="admin-category-delete-modal__product-price">{formatPrice(product.price)}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="admin-category-delete-modal__help">Buka Kelola produk, edit kategori pada produk di atas, lalu kembalilah ke sini. Tombol hapus akan tersedia setelah semua produk dipindahkan.</p>
                      <button type="button" className="admin-category-delete-modal__manage" onClick={manageCategoryProducts}>
                        <ArrowRight size={14} /> Ke Kelola Produk
                      </button>
                    </>
                  )}
                  {pendingCategoryProducts.length === 0 && (
                    <>
                      <p className="admin-confirm-modal__text">
                        Kategori “{pendingDelete.item.name}” akan dihapus dari katalog. Tindakan ini tidak dapat dibatalkan.
                      </p>
                      {dialogError && <p className="admin-form-error" role="alert">{dialogError}</p>}
                    </>
                  )}
                </div>
                <div className="admin-modal__actions">
                  <button type="button" className="admin-secondary-button" onClick={() => {
                    setPendingDelete(null);
                    setDialogError('');
                  }} disabled={saving}>Batal</button>
                  <button
                    type="button"
                    className="admin-danger-button"
                    onClick={confirmDelete}
                    disabled={saving || pendingCategoryProducts.length > 0}
                  >
                    {saving ? 'Menghapus...' : 'Hapus Kategori'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <header className="admin-product-delete-modal__header">
                  <div>
                    <h2 id="admin-delete-title">Hapus produk ini?</h2>
                    <p>Pastikan rangkaian ini memang ingin kamu hapus.</p>
                  </div>
                  <button
                    type="button"
                    className="admin-category-delete-modal__close"
                    aria-label="Tutup"
                    onClick={() => {
                      setPendingDelete(null);
                      setDialogError('');
                    }}
                    disabled={saving}
                  >
                    <img src={xClose} alt="" width={18} height={18} />
                  </button>
                </header>
                <div className="admin-product-delete-modal__body">
                  <div className="admin-product-delete-modal__product">
                    {pendingProductImage
                      ? <img src={pendingProductImage} alt={`Foto ${pendingProduct.name}`} />
                      : <span className="admin-product-delete-modal__placeholder"><Flower2 size={22} /></span>}
                    <div>
                      <h3>{pendingProduct.name}</h3>
                      <p>{pendingProductCategory} · {formatPrice(pendingProduct.price)}</p>
                      <small>Stok: {Number(pendingProduct.stock) || 0} rangkaian · {isInStock(pendingProduct) ? 'Tersedia' : 'Habis'}</small>
                    </div>
                  </div>
                  <div className="admin-product-delete-modal__warning" role="note">
                    <AlertTriangle size={15} />
                    <span>Produk akan dihapus dari katalog dan tidak bisa dipesan lagi. Tindakan ini tidak dapat dibatalkan.</span>
                  </div>
                  <p className="admin-product-delete-modal__help">Hanya ingin menghentikan pesanan sementara? Ubah status menjadi Habis tanpa menghapus produk.</p>
                  {dialogError && <p className="admin-form-error" role="alert">{dialogError}</p>}
                </div>
                <div className="admin-modal__actions">
                  <button type="button" className="admin-secondary-button" onClick={() => {
                    setPendingDelete(null);
                    setDialogError('');
                  }} disabled={saving}>Batal</button>
                  <button type="button" className="admin-danger-button" onClick={confirmDelete} disabled={saving}>
                    <Trash2 size={14} /> {saving ? 'Menghapus...' : 'Hapus Produk'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {showNotification && (
        <div className="admin-notification">
          <div className="admin-notification__badge">
            <img src={ikon6} alt="Ikon" width={16} height={16} />
          </div>
          <p>{notificationMessage || 'Perubahan berhasil disimpan'}</p>
          <button type="button" className="admin-notification__close" onClick={() => setShowNotification(false)}>
            <img src={xClose} alt="Close" width={16} height={16} />
          </button>
        </div>
      )}
    </div>
  );
}
