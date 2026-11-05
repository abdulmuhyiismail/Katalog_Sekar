import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteCategory,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  saveCategory,
  saveProduct,
  toggleProductStock,
} from '../services/api';
import { AlertTriangle, ArrowRight, Check, Flower2, ImagePlus, Trash2 } from 'lucide-react';

import lambangBunga from '../assets/admin/icons/lambang-bunga.svg';
import ikon from '../assets/admin/icons/ikon.svg';
import layers from '../assets/admin/icons/layers.svg';
import store from '../assets/admin/icons/store.svg';
import logOut from '../assets/admin/icons/log-out.svg';
import ikon1 from '../assets/admin/icons/ikon1.svg';
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

function getImageSource(image) {
  if (!image) return '';
  if (/^https?:\/\//i.test(image) || image.startsWith('/')) return image;
  return `/uploads/${encodeURIComponent(image)}`;
}

function isInStock(product) {
  return Number(product.stock) > 0 && product.stockStatus !== 'Habis';
}

function AdminEditorDialog({ type, item, categories, saving, error, onSave, onClose }) {
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
            <p>{isProduct ? 'Katalog Sekar' : item ? 'Perbarui katalog' : 'Katalog Sekar'}</p>
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

export function AdminDashboard({
  user, adminUser,
  onExit, onBackToCatalog,
  onLogout,
  onCatalogChanged, onRefreshData,
}) {
  const actualUser = user ?? adminUser;
  const actualOnExit = onExit ?? onBackToCatalog;
  const actualOnCatalogChanged = onCatalogChanged ?? onRefreshData;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [productsList, setProducts] = useState([]);
  const [categoriesList, setCategories] = useState([]);
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableCount = productsList.filter(isInStock).length;

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
          <span>sekar.</span>
        </div>
        <p className="admin-sidebar__label">RUANG KELOLA SEKAR</p>
        <nav className="admin-sidebar__nav" aria-label="Menu admin">
          <button type="button" className={activeTab === 'dashboard' ? 'is-active' : ''} onClick={() => setActiveTab('dashboard')}>
            <img src={ikon} alt="Ikon" width={18} height={18} /> Kelola produk
          </button>
          <button type="button" className={activeTab === 'categories' ? 'is-active' : ''} onClick={() => setActiveTab('categories')}>
            <img src={layers} alt="Layers" width={18} height={18} /> Kelola kategori
          </button>
        </nav>
        <div className="admin-sidebar__bottom">
          <div className="admin-sidebar__help">
            <img src={store} alt="Store" width={18} height={18} />
            <div>
              <p className="admin-sidebar__help-title">Katalog siap menyapa.</p>
              <p className="admin-sidebar__help-desc">Lihat tampilan bunga yang dilihat pelangganmu.</p>
              <p className="admin-sidebar__help-link">Lihat katalog ↗</p>
            </div>
          </div>
          <div className="admin-sidebar__profile">
            <div className="admin-avatar">
              {(actualUser?.name || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{actualUser?.name || 'Admin Sekar'}</strong>
              <small>Administrator</small>
            </div>
          </div>
          <button className="admin-sidebar__logout" type="button" onClick={onLogout}>
            <img src={logOut} alt="Log out" width={18} height={18} /> Keluar
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>Panel admin</span> <span>/</span> <strong>{activeTab === 'categories' ? 'Kelola kategori' : 'Kelola produk'}</strong>
          </div>
          <div className="admin-topbar__right">
            <div className="admin-sidebar__profile">
              <div className="admin-avatar">
                {(actualUser?.name || 'A').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong>{actualUser?.name || 'Admin Sekar'}</strong>
                <small>Administrator</small>
              </div>
            </div>
            <img src={ikon1} alt="Ikon" width={14} height={14} />
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-page-top">
            <div className="admin-page-heading">
              <p className="admin-eyebrow">RUANG KERJA SEKAR</p>
              <h1>{activeTab === 'categories' ? 'Kelola kategori' : 'Kelola katalog bunga'}</h1>
              <p>{activeTab === 'categories' ? 'Bantu pelanggan menemukan bunga yang mereka cari.' : 'Rawat setiap rangkaian, dari harga hingga ketersediaan.'}</p>
            </div>
            <button className="admin-primary-button" type="button" onClick={() => openEditor(activeTab === 'categories' ? 'category' : 'product')}>
              <img src={plus} alt="" width={18} height={18} /> Tambah {activeTab === 'categories' ? 'Kategori' : 'Produk'}
            </button>
          </div>

          {pageError && (
            <div className="admin-notice admin-notice--error" role="alert">
              {pageError}
              <button type="button" onClick={loadData}>Coba lagi</button>
            </div>
          )}

          <div className="admin-stat-grid">
            {activeTab === 'categories' ? (
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

          {activeTab === 'categories' ? (
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
                  <div className="admin-table-footer">Menampilkan {filteredProducts.length} produk dalam katalog Sekar.</div>
                </div>
              ) : (
                <div className="admin-empty">{productsList.length ? 'Produk tidak ditemukan.' : 'Belum ada produk.'}</div>
              )}
            </div>
          )}

          <p className="admin-content__footnote">Katalog Sekar diperbarui otomatis saat Anda menyimpan perubahan.</p>
        </div>
      </main>

      {editor && (
        <AdminEditorDialog
          key={`${editor.type}-${editor.item?.id || 'new'}`}
          type={editor.type}
          item={editor.item}
          categories={categoriesList}
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
