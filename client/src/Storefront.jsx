import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Flower2,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Sprout,
  Trash2,
  Truck,
  UserRound,
} from 'lucide-react';
import fotoBunga0 from './assets/admin/images/foto-bunga0.png';
import fotoBunga1 from './assets/admin/images/foto-bunga1.png';
import fotoBunga2 from './assets/admin/images/foto-bunga2.png';
import fotoBunga3 from './assets/admin/images/foto-bunga3.png';
import fotoBunga4 from './assets/admin/images/foto-bunga4.png';
import fotoBunga5 from './assets/admin/images/foto-bunga5.png';
import fotoBunga6 from './assets/admin/images/foto-bunga6.png';
import fotoBunga7 from './assets/admin/images/foto-bunga7.png';
import lambangBunga from './assets/admin/icons/lambang-bunga.svg';
import { AdminDashboard } from './components/AdminDashboard';
import { OrderModal } from './components/OrderModal';
import { UserAuthPage } from './components/UserAuthPage';
import {
  clearAuthToken,
  clearUserAuthToken,
  fetchCategories,
  fetchAdminProfile,
  fetchMyOrders,
  fetchProducts,
  fetchStoreSettings,
  fetchUserProfile,
  getUserAuthToken,
} from './services/api';
import './Storefront.css';

const heroImage = '/images/sekar-signature-bouquet.png';
const USER_CART_STORAGE_PREFIX = 'sekar_user_cart_';

function getUserCartStorageKey(userId) {
  return `${USER_CART_STORAGE_PREFIX}${encodeURIComponent(userId)}`;
}

function readUserCart(userId) {
  const savedCart = localStorage.getItem(getUserCartStorageKey(userId));
  if (!savedCart) return [];

  try {
    const parsedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedCart)) throw new Error('Format keranjang tidak valid.');
    return parsedCart.filter((item) =>
      item &&
      item.product &&
      typeof item.product.id === 'string' &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0,
    );
  } catch {
    localStorage.removeItem(getUserCartStorageKey(userId));
    return [];
  }
}

const seededProductImages = {
  'Senandung Mawar': fotoBunga0,
  'Sinar Pagi': fotoBunga1,
  'Peluk dalam Bunga': fotoBunga2,
  'Tulip untukmu': fotoBunga3,
  'Putih yang Tulus': fotoBunga4,
  'Rona Senja': fotoBunga5,
  'Abadi dalam Rasa': fotoBunga6,
  'Taman Kecil': fotoBunga7,
};

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function getWhatsAppUrl(settings, message) {
  if (
    settings?.activeWhatsApp === false ||
    String(settings?.activeWhatsApp).toLowerCase() === 'false'
  ) {
    return null;
  }

  let phone = String(settings?.phone || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
  if (phone.length < 9) return null;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function getProductImage(product) {
  const image = product.image;
  if (image && !image.startsWith('/images/')) {
    if (/^https?:\/\//i.test(image) || image.startsWith('/')) return image;
    return `/uploads/${encodeURIComponent(image)}`;
  }
  return seededProductImages[product.name] || image || getFallbackProductImage(product);
}

function getFallbackProductImage(product) {
  const productDetails = `${product.name} ${product.categoryName || ''}`.toLowerCase();

  if (/kering|dried/.test(productDetails)) return '/images/dried-bouquet.jpg';
  if (/mawar|rose/.test(productDetails)) return '/images/pink-roses.jpg';
  if (/meja|vas|anggrek|orchid/.test(productDetails)) {
      return '/images/flower-arrangement.jpg';
  }
  if (/buket|tulip|lily/.test(productDetails)) return heroImage;

  return '/images/wildflowers.jpg';
}

function ProductImage({ product, index }) {
  const [imageState, setImageState] = useState(
      product.image ? 'source' : 'fallback',
  );
  const fallbackSrc = getFallbackProductImage(product);
  const src =
      imageState === 'placeholder'
        ? ''
      : imageState === 'fallback'
          ? fallbackSrc
          : getProductImage(product);

  return (
    <div className="store-product__image-wrap">
      {src ? (
        <img
          className="store-product__image"
          src={src}
          alt={product.name}
          loading={index < 4 ? 'eager' : 'lazy'}
          onError={() => {
            setImageState((current) =>
              current === 'source' ? 'fallback' : 'placeholder',
            );
          }}
        />
      ) : (
        <div className="store-product__image-placeholder" aria-hidden="true">
          <Flower2 size={42} strokeWidth={1.2} />
        </div>
      )}
      {!isAvailable(product) && (
        <span className="store-product__sold-out">Habis</span>
      )}
      {product.badge && isAvailable(product) && (
        <span className="store-product__badge">{product.badge}</span>
      )}
    </div>
  );
}

function isAvailable(product) {
  const status = String(product.stockStatus ?? '').trim().toLowerCase();
  const stock = Number(product.stock);
  if (['habis', 'out of stock', 'sold out', 'false'].includes(status)) return false;
  if (Number.isFinite(stock)) return stock > 0;
  if (status && Number.isFinite(Number(status))) return Number(status) > 0;
  return true;
}

function ProductCard({ product, index, onAdd, onView, stagger, canOrder }) {
  const available = isAvailable(product);
  return (
    <article className={`store-product ${stagger || ''}`}>
      <button
        className="store-product__view"
        type="button"
        onClick={() => onView(product)}
        aria-label={`Lihat detail ${product.name}`}
      >
        <ProductImage product={product} index={index} />
      </button>
      <div className="store-product__details">
        <p className="store-product__category">
          {product.categoryName || 'Rangkaian bunga'}
        </p>
        <button className="store-product__title" type="button" onClick={() => onView(product)}>
          <h3>{product.name}</h3>
        </button>
        {product.description && (
          <p className="store-product__description">{product.description}</p>
        )}
        <p className="store-product__price">{formatPrice(product.price)}</p>
        <button
          className="store-button store-button--product"
          type="button"
          disabled={!available || !canOrder}
          onClick={() => onAdd(product)}
        >
          {available ? <ShoppingBag size={14} /> : null}
          {!available
            ? 'Stok habis'
            : canOrder
              ? 'Tambah ke keranjang'
              : 'Masuk untuk memesan'}
        </button>
      </div>
    </article>
  );
}

function HomeOrderStatus({ user, onOpenAccount }) {
  const [orders, setOrders] = useState(null);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;

    fetchMyOrders()
      .then((response) => {
        if (active) {
          setOrders(response.data);
          setLoadedUserId(userId);
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) {
          setLoadedUserId(userId);
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Status pesanan belum dapat dimuat.',
          );
        }
      })
      .finally(() => {
        if (active) setRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [userId, refreshKey]);

  const hasCurrentUserData = loadedUserId === userId;
  const currentOrders = hasCurrentUserData ? orders : null;
  const currentError = hasCurrentUserData ? error : '';
  const latestOrders = currentOrders?.slice(0, 3) || [];

  return (
    <section className="store-container store-order-status" aria-labelledby="store-order-status-title">
      <div className="store-order-status__heading">
        <div>
          <p className="store-eyebrow"><PackageCheck size={15} /> Status pesanan</p>
          <h2 id="store-order-status-title">Pantau pesananmu.</h2>
        </div>
        {user && (
          <div className="store-order-status__actions">
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                setRefreshKey((current) => current + 1);
              }}
              disabled={refreshing}
            >
              <RefreshCw size={15} /> Muat ulang
            </button>
            <button type="button" onClick={onOpenAccount}>
              Lihat semua pesanan
            </button>
          </div>
        )}
      </div>
      {!user ? (
        <p className="store-order-status__message">
          Masuk ke akun untuk melihat perkembangan pesanan.
          <button type="button" onClick={onOpenAccount}>Masuk akun</button>
        </p>
      ) : currentError ? (
        <p className="store-order-status__message store-order-status__message--error" role="alert">
          {currentError}
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              setRefreshKey((current) => current + 1);
            }}
          >
            Coba lagi
          </button>
        </p>
      ) : currentOrders === null ? (
        <p className="store-order-status__message" role="status">Memuat status pesanan...</p>
      ) : latestOrders.length ? (
        <div className="store-order-status__list">
          {latestOrders.map((order) => (
            <article className="store-order-status__item" key={order.id}>
              <div>
                <strong>Pesanan #{order.id.slice(0, 8).toUpperCase()}</strong>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <span className={`user-order-status user-order-status--${order.status}`}>
                {order.status === 'confirmed'
                  ? 'Dikonfirmasi'
                  : order.status === 'rejected'
                    ? 'Ditolak'
                    : 'Menunggu konfirmasi'}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="store-order-status__message">
          Belum ada pesanan. Pesanan yang dibuat akan tampil di sini.
        </p>
      )}
    </section>
  );
}

function QuantityControl({ quantity, onChange, maximum, label }) {
  return (
    <div className="store-quantity" aria-label={label || 'Jumlah rangkaian'}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        aria-label="Kurangi jumlah"
        disabled={quantity <= 1}
      >
        <Minus size={14} />
      </button>
      <span>{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(maximum, quantity + 1))}
        aria-label="Tambah jumlah"
        disabled={quantity >= maximum}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export function Storefront() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('recommended');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin';
  const [adminMode, setAdminMode] = useState('store');
  const [adminUser, setAdminUser] = useState(null);
  const [userMode, setUserMode] = useState(isAdminRoute ? 'login' : 'store');
  const [user, setUser] = useState(null);
  const [userNotice, setUserNotice] = useState('');
  const [orderItems, setOrderItems] = useState(null);
  const [orderNote, setOrderNote] = useState('');
  const [cart, setCart] = useState([]);
  const [cartNote, setCartNote] = useState('');
  const [page, setPage] = useState('catalog');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [detailNote, setDetailNote] = useState('');
  const [cartNotice, setCartNotice] = useState('');

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(getUserCartStorageKey(user.id), JSON.stringify(cart));
    }
  }, [cart, user?.id]);

  const loadCatalog = async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const [productResponse, categoryResponse, storeResponse] =
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchStoreSettings(),
        ]);
      setProducts(productResponse.data);
      setCategories(categoryResponse.data);
      setSettings(storeResponse.data);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Katalog belum dapat dimuat. Silakan coba lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initializeCatalog = async () => {
      try {
        const [productResponse, categoryResponse, storeResponse] =
          await Promise.all([
            fetchProducts(),
            fetchCategories(),
            fetchStoreSettings(),
          ]);
        if (!active) return;
        setProducts(productResponse.data);
        setCategories(categoryResponse.data);
        setSettings(storeResponse.data);
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Katalog belum dapat dimuat. Silakan coba lagi.',
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void initializeCatalog();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!getUserAuthToken()) return undefined;

    fetchUserProfile()
      .then((profile) => {
        if (active && profile) {
          setCart(readUserCart(profile.id));
          setUser(profile);
        }
      })
      .catch((error) => {
        if (active) {
          setUserNotice(
            error instanceof Error
              ? `Sesi akun belum dapat dipulihkan: ${error.message}`
              : 'Sesi akun belum dapat dipulihkan.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    const result = products.filter((product) => {
      const matchesCategory =
        !activeCategory || product.categoryId === activeCategory;
      const searchableText = [
        product.name,
        product.description,
        product.categoryName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('id-ID');
      return matchesCategory && (!query || searchableText.includes(query));
    });

    if (sortOrder === 'price-low') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOrder === 'price-high') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortOrder === 'newest') {
      result.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }

    return result;
  }, [products, activeCategory, search, sortOrder]);

  const startingPrice = products.length
    ? Math.min(...products.map((product) => Number(product.price) || 0))
    : null;
  const storeName = settings?.storeName || 'Sekar';
  useEffect(() => {
    document.title = `${storeName} — Bunga untuk Setiap Rasa`;
  }, [storeName]);
  const contactUrl = getWhatsAppUrl(
    settings,
    `Halo ${storeName}, saya ingin berkonsultasi tentang rangkaian bunga.`,
  );
  const mapUrl = settings?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
    : null;
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0,
  );
  const relatedProducts = selectedProduct
    ? products
        .filter((product) => product.id !== selectedProduct.id)
        .slice(0, 3)
    : [];

  function openProduct(product) {
    setSelectedProduct(product);
    setDetailQuantity(1);
    setDetailNote('');
    setPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submitSearch(event) {
    event.preventDefault();
    setPage('catalog');
    window.setTimeout(() => {
      document.getElementById('katalog')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  function addToCart(product, quantity = 1, note = '') {
    if (!user) return;

    const stockLimit = Number(product.stock);
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      const nextQuantity = (existing?.quantity || 0) + quantity;
      const safeQuantity = Number.isFinite(stockLimit)
        ? Math.min(stockLimit, nextQuantity)
        : nextQuantity;

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: safeQuantity, note: note || item.note }
            : item,
        );
      }
      return [...current, { product, quantity: safeQuantity, note }];
    });
    setCartNotice(`${product.name} ditambahkan ke keranjang.`);
    window.setTimeout(() => setCartNotice(''), 2800);
  }

  function updateCartQuantity(productId, quantity) {
    setCart((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    );
  }

  function removeFromCart(product) {
    setCart((current) =>
      current.filter((item) => item.product.id !== product.id),
    );
    setCartNotice(`${product.name} dihapus dari keranjang.`);
    window.setTimeout(() => setCartNotice(''), 2800);
  }

  function openOrder(items, note = '') {
    if (!user) return;

    setOrderItems(items);
    setOrderNote(
      [note, ...items.map((item) => item.note)]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join('\n'),
    );
  }

  useEffect(() => {
    if (!isAdminRoute) return;

    fetchAdminProfile()
      .then((profile) => {
        if (profile) {
          setAdminUser(profile);
          setAdminMode('dashboard');
        }
      })
      .catch(() => clearAuthToken());
  }, [isAdminRoute]);

  function returnToStore() {
    setAdminMode('store');
    setUserMode('store');
    if (isAdminRoute) window.history.replaceState(null, '', '/');
  }

  function logoutUser() {
    if (user?.id) {
      localStorage.setItem(getUserCartStorageKey(user.id), JSON.stringify(cart));
    }
    clearUserAuthToken();
    setUser(null);
    setUserMode('store');
    setOrderItems(null);
    setOrderNote('');
    setCart([]);
    setCartNote('');
    setCartNotice('');
    setPage('catalog');
    setSelectedProduct(null);
    setUserNotice('Kamu sudah keluar dari akun. Keranjang disimpan untuk akunmu dan tidak ditampilkan saat logout.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (adminMode === 'dashboard') {
    return (
      <AdminDashboard
        user={adminUser}
        settings={settings}
        onExit={returnToStore}
        onLogout={() => {
          clearAuthToken();
          setAdminUser(null);
          setAdminMode('store');
          setUserMode('login');
        }}
        onCatalogChanged={loadCatalog}
        onStoreSettingsChanged={setSettings}
      />
    );
  }

  if (userMode !== 'store') {
    return (
      <UserAuthPage
        mode={userMode}
        user={user}
        settings={settings}
        onBack={returnToStore}
        onModeChange={setUserMode}
        onLogin={({ role, user: signedInUser }) => {
          if (role === 'admin') {
            setAdminUser(signedInUser);
            setAdminMode('dashboard');
            return;
          }
          setCart(readUserCart(signedInUser.id));
          setUser(signedInUser);
          setUserMode('store');
          setUserNotice('');
          if (isAdminRoute) window.history.replaceState(null, '', '/');
        }}
        onLogout={logoutUser}
      />
    );
  }

  return (
    <div className="storefront">
      <div className="store-announcement">
        <p>
          {user ? (
            <>
              Sedikit bunga, banyak bahagia. Gratis ongkir hingga Rp20.000 untuk
              pesanan pertama.
              <span>Kode: MAREKPERTAMA</span>
            </>
          ) : (
            <>Mode lihat saja — masuk akun untuk melakukan pemesanan.</>
          )}
        </p>
      </div>

      <header className="store-header">
        <div className="store-container store-header__inner">
          <a className="store-logo" href="#beranda" aria-label={`${storeName} beranda`} onClick={() => setPage('catalog')}>
            <img className="store-logo__mark" src={lambangBunga} alt="" width={20} height={29} />
            <span>{storeName.toLowerCase()}.</span>
          </a>
          <nav className="store-nav" aria-label="Navigasi utama">
            <a className="is-active" href="#katalog" onClick={() => setPage('catalog')}>Katalog bunga</a>
            <a href="#cara-pesan" onClick={() => setPage('catalog')}>Cara pesan</a>
            <a href="#tentang" onClick={() => setPage('catalog')}>Tentang {storeName}</a>
          </nav>
          <div className="store-header__actions">
            <form className="store-search" role="search" onSubmit={submitSearch}>
              <button type="submit" aria-label="Cari produk">
                <Search size={16} aria-hidden="true" />
              </button>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari bunga untuk siapa hari ini?"
                aria-label="Cari bunga"
              />
            </form>
            {user && (
              <button
                className="store-header__catalog-link"
                type="button"
                onClick={() => {
                  setPage('cart');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-label={`Buka keranjang, ${cartCount} produk`}
              >
                <ShoppingBag size={18} />
                <span className="store-header__cart-count">{cartCount}</span>
              </button>
            )}
            <button
              className="store-header__account"
              type="button"
              onClick={() => setUserMode(user ? 'account' : 'login')}
              aria-label={user ? `Akun ${user.name}` : 'Masuk atau daftar akun'}
              title={user ? user.name : 'Masuk atau daftar'}
            >
              <UserRound size={18} aria-hidden="true" />
              <span>{user ? user.name.split(' ')[0] : 'Masuk'}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="beranda">
        {page === 'catalog' && (
          <>
        <section className="store-container store-hero animate-enter">
          <div className="store-hero__copy">
            <p className="store-eyebrow stagger-1"><Sparkles size={16} /> Dirangkai dengan hati</p>
            <h1 className="stagger-2">Ada bunga untuk setiap rasa.</h1>
            <p className="store-hero__description stagger-3">
              {settings?.tagline || 'Dari ucapan sederhana hingga momen istimewa, kirimkan rasa lewat bunga segar yang dirangkai khusus untukmu.'}
            </p>
            <div className="store-hero__actions stagger-4">
              <a className="store-button" href="#katalog">
                <ArrowDown size={16} />
                Temukan bunga favoritmu
              </a>
              {startingPrice !== null && (
                <span className="starting-price">Mulai <strong>{formatPrice(startingPrice)}</strong></span>
              )}
            </div>
          </div>
          <div className="store-hero__visual animate-float">
            <img src={heroImage} alt={`Rangkaian buket bunga segar ${storeName}`} />
            <div className="store-hero__caption">
              <span>The signature collection</span>
              <strong>Seindah niat baikmu.</strong>
            </div>
          </div>
        </section>

        <section className="store-container store-catalog store-catalog--first" id="katalog">
          <div className="store-catalog__heading animate-enter">
            <div>
              <p className="store-eyebrow">Pilihan dari hati</p>
              <h2>Temukan rangkaian ceritamu.</h2>
            </div>
          </div>

          <div className="store-catalog__filters animate-enter stagger-1">
            <div className="store-category-list" aria-label="Filter kategori">
              <button
                className={!activeCategory ? 'is-selected' : ''}
                type="button"
                onClick={() => setActiveCategory('')}
              >
                <Flower2 size={15} /> Semua bunga
              </button>
              {categories.map((category) => (
                <button
                  className={activeCategory === category.id ? 'is-selected' : ''}
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <label className="store-sort">
              <span>Urutkan:</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                aria-label="Urutkan produk"
              >
                <option value="recommended">Rekomendasi</option>
                <option value="newest">Terbaru</option>
                <option value="price-low">Harga terendah</option>
                <option value="price-high">Harga tertinggi</option>
              </select>
              <ArrowDown size={13} aria-hidden="true" />
            </label>
          </div>

          {isLoading ? (
            <div className="store-state" role="status">Memuat rangkaian bunga...</div>
          ) : loadError ? (
            <div className="store-state store-state--error" role="alert">
              <p>{loadError}</p>
              <button className="store-button" type="button" onClick={loadCatalog}>
                Coba lagi <ArrowRight size={16} />
              </button>
            </div>
          ) : filteredProducts.length ? (
            <>
              <p className="store-result-count animate-enter stagger-2">
                Menampilkan {filteredProducts.length} rangkaian pilihan
              </p>
              <div className="store-product-grid">
                {filteredProducts.map((product, index) => {
                  const stagger = index % 4 === 0 ? 'stagger-1' : index % 4 === 1 ? 'stagger-2' : index % 4 === 2 ? 'stagger-3' : 'stagger-4';
                  return (
                    <ProductCard
                      key={`${product.id}-${product.image || ''}-${product.name}-${index}`}
                      product={product}
                      index={index}
                      onView={openProduct}
                      onAdd={(item) => addToCart(item)}
                      canOrder={Boolean(user)}
                      stagger={stagger}
                    />
                  );
                })}
              </div>
              <p className="store-catalog__note store-catalog__note--below">
                Untuk merayakan, menguatkan, atau sekadar bilang: “aku ingat kamu.”
                Pilih bunga yang mewakilimu.
              </p>
              <p className="store-catalog__footnote animate-enter stagger-4">
                <Sprout size={14} />
                Setiap bunga punya keunikannya. Jenis dan warna dapat menyesuaikan
                musim, tetap dengan keindahan yang sama.
              </p>
            </>
          ) : (
            <div className="store-state animate-enter">
              <Flower2 size={34} strokeWidth={1.4} />
              <h3>Bunganya belum ditemukan</h3>
              <p>Coba kata kunci atau kategori lain untuk menemukan rangkaianmu.</p>
              <button
                className="store-button"
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveCategory('');
                }}
              >
                Tampilkan semua bunga <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>

        <section className="store-container store-benefits" aria-label={`Keunggulan ${storeName}`}>
          <div className="store-benefit animate-enter">
            <Flower2 size={21} />
            <div><strong>Segar, setiap hari</strong><span>Bunga pilihan dari petani lokal</span></div>
          </div>
          <div className="store-benefit animate-enter stagger-1">
            <Truck size={21} />
            <div><strong>Kirim di hari yang sama</strong><span>Untuk area Jakarta & sekitarnya</span></div>
          </div>
          <div className="store-benefit animate-enter stagger-2">
            <Gift size={21} />
            <div><strong>Personal di setiap detail</strong><span>Gratis kartu ucapan untukmu</span></div>
          </div>
          <div className="store-benefit animate-enter stagger-3">
            <MessageCircle size={21} />
            <div><strong>Pesan tanpa ribet</strong><span>Langsung lewat WhatsApp</span></div>
          </div>
        </section>

        <HomeOrderStatus
          user={user}
          onOpenAccount={() => setUserMode(user ? 'account' : 'login')}
        />

        <section className="store-container store-story-grid">
          <article className="store-story-card" id="cara-pesan">
            <p className="store-eyebrow"><MessageCircle size={14} /> Cara pesan</p>
            <h2>Pesan bunga dengan mudah.</h2>
            <p>Pilih rangkaian, isi catatan, lalu pesan melalui WhatsApp. Kami akan membantu memastikan pilihanmu sesuai.</p>
            <ol>
              <li><span>1</span> Pilih bunga dan isi kartu ucapan</li>
              <li><span>2</span> Kirim detail melalui WhatsApp</li>
              <li><span>3</span> Kami konfirmasi pesanan dan jadwal</li>
            </ol>
          </article>
          <article className="store-story-card" id="tentang">
            <p className="store-eyebrow"><Flower2 size={14} /> Tentang {storeName}</p>
            <h2>Dirangkai dengan hati.</h2>
            <p>{storeName} hadir untuk menemani setiap cerita lewat bunga segar pilihan yang dirangkai dengan penuh perhatian.</p>
            <p className="store-story-card__address">
              <MapPin size={14} />
              {settings?.address || `Studio ${storeName}, Jakarta`}
            </p>
          </article>
        </section>

        <section className="store-container store-care" id="perawatan-bunga">
          <div className="store-care__heading">
            <p className="store-eyebrow"><Heart size={14} /> Perawatan bunga</p>
            <h2>Agar buketmu tetap segar lebih lama.</h2>
            <p>Potong ujung batang secara diagonal, letakkan dalam vas bersih berisi air, dan ganti airnya setiap hari. Jauhkan bunga dari sinar matahari langsung, sumber panas, dan buah matang.</p>
          </div>
          <div className="store-care__tips">
            <div><Sprout size={18} /><strong>Rapikan batang</strong><span>Potong sedikit bagian bawah batang sebelum bunga dimasukkan ke vas.</span></div>
            <div><Flower2 size={18} /><strong>Gunakan vas bersih</strong><span>Buang daun yang terendam agar air tetap bersih dan bunga lebih awet.</span></div>
            <div><Heart size={18} /><strong>Pilih tempat sejuk</strong><span>Simpan rangkaian di tempat sejuk, jauh dari matahari dan buah-buahan.</span></div>
          </div>
        </section>

        <section className="store-container store-help animate-enter" id="konsultasi">
          <div className="store-help__mark animate-float"><Flower2 size={34} strokeWidth={1.2} /></div>
          <div className="store-help__copy">
            <h2>Belum menemukan bunga yang pas?</h2>
            <p>Ceritakan momen dan tujuanmu. Florist kami siap merangkai sesuatu yang personal.</p>
          </div>
          {user ? (
            contactUrl ? (
              <a className="store-button" href={contactUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={16} /> Konsultasi via WhatsApp
              </a>
            ) : (
              <span className="store-help__contact-unavailable">
                WhatsApp toko belum diatur
              </span>
            )
          ) : (
            <span className="store-help__contact-unavailable">
              Masuk akun untuk konsultasi dan pemesanan
            </span>
          )}
          <span className="store-help__hours">Setiap hari, 08.00–19.00 WIB · Gratis konsultasi</span>
        </section>
          </>
        )}

        {page === 'detail' && selectedProduct && (
          <section className="store-container store-detail">
            <nav className="store-breadcrumbs" aria-label="Breadcrumb">
              <button type="button" onClick={() => setPage('catalog')}>Katalog bunga</button>
              <ChevronRight size={14} />
              <span>{selectedProduct.categoryName || 'Buket bunga'}</span>
              <ChevronRight size={14} />
              <strong>{selectedProduct.name}</strong>
            </nav>
            <div className="store-detail__layout">
              <div>
                <ProductImage product={selectedProduct} index={0} />
                <p className="store-detail__caption"><Sprout size={14} /> Setiap bunga punya keunikannya. Jenis dan warna dapat menyesuaikan musim.</p>
              </div>
              <div className="store-detail__copy">
                <p className="store-eyebrow">{selectedProduct.categoryName || 'Buket bunga'}</p>
                <h1>{selectedProduct.name}</h1>
                <p className="store-detail__subtitle">{selectedProduct.description || 'Dirangkai segar dengan pilihan bunga terbaik.'}</p>
                <div className="store-detail__price-row">
                  <strong>{formatPrice(selectedProduct.price)}</strong>
                  <span><i /> {isAvailable(selectedProduct) ? `${selectedProduct.stock} Tersedia` : 'Stok habis'}</span>
                </div>
                <p className="store-detail__description">
                  {selectedProduct.description || 'Rangkaian bunga pilihan, dirangkai dengan penuh perhatian untuk momen istimewamu.'}
                  {' '}Setiap rangkaian dibuat segar dan dapat disesuaikan dengan kebutuhanmu.
                </p>
                {user ? (
                  <>
                    <div className="store-detail__quantity">
                      <div><strong>Jumlah rangkaian</strong><small>{selectedProduct.stock} rangkaian tersedia</small></div>
                      <QuantityControl
                        quantity={detailQuantity}
                        maximum={Math.max(Number(selectedProduct.stock) || 1, 1)}
                        onChange={setDetailQuantity}
                      />
                    </div>
                    <label className="store-detail__note">
                      Pesan kartu ucapan <small>Opsional · Gratis</small>
                      <textarea rows={3} maxLength={200} value={detailNote} onChange={(event) => setDetailNote(event.target.value)} placeholder="Tuliskan pesan yang ingin kamu sampaikan..." />
                    </label>
                    <button
                      type="button"
                      className="store-button store-detail__add"
                      disabled={!isAvailable(selectedProduct)}
                      onClick={() => addToCart(selectedProduct, detailQuantity, detailNote)}
                    >
                      <ShoppingBag size={16} /> Tambah ke keranjang
                    </button>
                    <button
                      type="button"
                      className="store-button secondary store-detail__whatsapp"
                      disabled={!isAvailable(selectedProduct)}
                      onClick={() => openOrder([{ product: selectedProduct, quantity: detailQuantity }], detailNote)}
                    >
                      <MessageCircle size={16} /> Pesan via WhatsApp
                    </button>
                  </>
                ) : (
                  <p className="store-detail__delivery">
                    Mode lihat saja. Masuk melalui tombol akun untuk melakukan
                    pemesanan.
                  </p>
                )}
                <p className="store-detail__delivery"><Truck size={15} /> Dikantar atau diambil di studio. Jadwal dan ongkir dikonfirmasi melalui WhatsApp.</p>
              </div>
            </div>
            <div className="store-detail__features">
              <div><Flower2 size={18} /><h3>Dirangkai untukmu</h3><p>Bunga pilihan dirangkai menjadi buket yang personal.</p></div>
              <div><MapPin size={18} /><h3>Mampir ke studio</h3><p>{settings?.address || `Studio ${storeName}, Jakarta`}</p></div>
              <div><Heart size={18} /><h3>Rawat rasa, rawat bunga</h3><p>Ikuti petunjuk perawatan yang disertakan pada setiap rangkaian.</p></div>
            </div>
            <section className="store-related">
              <div className="store-related__heading">
                <div><p className="store-eyebrow">Cerita indah lainnya</p><h2>Rangkaian yang mungkin kamu suka.</h2></div>
                <button type="button" onClick={() => setPage('catalog')}>Lihat semua bunga <ArrowRight size={14} /></button>
              </div>
              <div className="store-product-grid">
                {relatedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    onView={openProduct}
                    onAdd={(item) => addToCart(item)}
                    canOrder={Boolean(user)}
                  />
                ))}
              </div>
            </section>
            <section className="store-container store-help" id="konsultasi-detail">
              <div className="store-help__mark"><Flower2 size={30} /></div>
              <div className="store-help__copy"><h2>Belum menemukan bunga yang pas?</h2><p>Florist kami siap membantu memilih rangkaian yang personal.</p></div>
              {contactUrl && user && <a className="store-button" href={contactUrl} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Konsultasi via WhatsApp</a>}
            </section>
          </section>
        )}

        {page === 'cart' && user && (
          <section className="store-container store-cart">
            <nav className="store-breadcrumbs" aria-label="Breadcrumb">
              <button type="button" onClick={() => setPage('catalog')}>Katalog bunga</button>
              <ChevronRight size={14} />
              <strong>Keranjang bunga</strong>
            </nav>
            <div className="store-cart__heading">
              <div><p className="store-eyebrow">Pilihan dari hati</p><h1>Keranjang bunga</h1><p>{cartCount ? `${cartCount} rangkaian, siap membawa bahagia.` : 'Rangkaian pilihanmu akan muncul di sini.'}</p></div>
              <button type="button" onClick={() => setPage('catalog')}><ArrowLeft size={15} /> Lanjut belanja</button>
            </div>
            {!cart.length ? (
              <div className="store-state store-cart__empty">
                <ShoppingBag size={34} strokeWidth={1.4} />
                <h3>Keranjangmu masih kosong</h3>
                <p>Temukan rangkaian bunga untuk momen spesialmu.</p>
                <button className="store-button" type="button" onClick={() => setPage('catalog')}>Jelajahi katalog <ArrowRight size={15} /></button>
              </div>
            ) : (
              <>
                <div className="store-cart__layout">
                  <div className="store-cart__items">
                    <div className="store-cart__items-heading"><strong>Rangkaian pilihanmu</strong><span>{cart.length} produk</span></div>
                    {cart.map(({ product, quantity }) => (
                      <article className="store-cart-item" key={product.id}>
                        <img src={getProductImage(product)} alt={product.name} />
                        <div className="store-cart-item__copy">
                          <span>{product.categoryName || 'Buket bunga'}</span>
                          <h2>{product.name}</h2>
                          <p>{product.description}</p>
                          <QuantityControl
                            quantity={quantity}
                            maximum={Math.max(Number(product.stock) || 1, 1)}
                            onChange={(value) => updateCartQuantity(product.id, value)}
                            label={`Jumlah ${product.name}`}
                          />
                          <button
                            className="store-cart-item__remove"
                            type="button"
                            aria-label={`Hapus ${product.name} dari keranjang`}
                            onClick={() => removeFromCart(product)}
                          >
                            <Trash2 size={14} /> Hapus dari keranjang
                          </button>
                        </div>
                        <strong className="store-cart-item__price">{formatPrice(Number(product.price) * quantity)}</strong>
                      </article>
                    ))}
                    <p className="store-cart__gift"><Gift size={15} /> Gratis kartu ucapan. Tulis pesan untuk florist di bawah.</p>
                  </div>
                  <aside className="store-cart-summary">
                    <h2>Ringkasan pesanan</h2>
                    <div><span>Subtotal produk ({cartCount})</span><strong>{formatPrice(cartSubtotal)}</strong></div>
                    <div><span>Ongkos kirim</span><strong>Dikonfirmasi via WhatsApp</strong></div>
                    <hr />
                    <div className="store-cart-summary__total"><span>Subtotal</span><strong>{formatPrice(cartSubtotal)}</strong></div>
                    <p>Belum termasuk ongkir. Total akhir, jadwal pengiriman, dan ketersediaan dikonfirmasi oleh florist sebelum pembayaran.</p>
                    <button className="store-button" type="button" onClick={() => openOrder(cart, cartNote)}>
                      <MessageCircle size={16} /> Checkout via WhatsApp
                    </button>
                    <div className="store-cart-summary__help"><MessageCircle size={15} /><span>Belum ada pembayaran di tahap ini. Florist akan membantu melengkapi alamat dan detail pesanan.</span></div>
                    {settings?.phone && <small>Butuh bantuan? {settings.phone}</small>}
                  </aside>
                </div>
                <label className="store-cart__note">Catatan untuk florist <small>Opsional</small>
                  <textarea rows={3} value={cartNote} onChange={(event) => setCartNote(event.target.value)} placeholder="Tuliskan pesan kartu untuk tiap rangkaian, nama penerima, atau kebutuhan khususmu..." />
                  <span>Catatan dan pilihan bungamu akan disertakan saat melanjutkan pesanan via WhatsApp.</span>
                </label>
                <div className="store-cart__delivery"><div><Truck size={18} /><span><strong>Untuk Jakarta & sekitarnya</strong><small>Pengiriman di hari yang sama dapat dikonfirmasi sesuai jadwalmu melalui WhatsApp.</small></span></div><div><MapPin size={18} /><span><strong>Ingin mengambil sendiri?</strong><small>Mampir ke studio {storeName} dan konfirmasi waktu pengambilan dengan florist.</small></span></div></div>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="store-footer animate-fade">
        <div className="store-container store-footer__grid">
          <div className="store-footer__brand">
            <a className="store-logo" href="#beranda">
              <img className="store-logo__mark" src={lambangBunga} alt="" width={20} height={29} />
              <span>{storeName.toLowerCase()}.</span>
            </a>
            <p>{settings?.tagline || 'Bunga segar, rasa yang tulus. Dirangkai dengan hati dan diantar untuk menghangatkan hari seseorang.'}</p>
            <a className="store-footer__social" href="#tentang">
              <ArrowUpRight size={15} /> @sekar.florist
            </a>
          </div>
          <div>
            <h3>Jelajahi {storeName}</h3>
            <a href="#katalog">Katalog bunga</a>
            <a href="#tentang">Tentang kami</a>
            <a href="#cara-pesan">Cara pemesanan</a>
            <a href="#perawatan-bunga" onClick={() => setPage('catalog')}>Perawatan bunga</a>
          </div>
          <div>
            <h3>Siap membantu</h3>
            <p>WhatsApp: {contactUrl ? settings.phone : 'Nomor belum diatur'}</p>
            <p>Senin–Minggu, 08.00–19.00 WIB</p>
            <p>Pengiriman Jakarta & sekitarnya</p>
          </div>
          <div>
            <h3>Mampir ke studio</h3>
            <p className="store-footer__address">
              <MapPin size={15} />
              {settings?.address || 'Alamat toko belum diatur'}
            </p>
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noreferrer">
                Lihat di peta <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </div>
      </footer>
      {cartNotice && <div className="store-toast" role="status">{cartNotice}</div>}
      {userNotice && <div className="store-toast" role="status">{userNotice}</div>}
      {user && orderItems && (
        <OrderModal
          items={orderItems}
          settings={settings}
          user={user}
          initialNote={orderNote}
          onClose={() => setOrderItems(null)}
        />
      )}
    </div>
  );
}

export default Storefront;
