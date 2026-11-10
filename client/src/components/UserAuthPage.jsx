import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Clock3,
  Eye,
  EyeOff,
  Flower2,
  LogOut,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
  UserRound,
} from 'lucide-react';
import {
  clearUserAuthToken,
  fetchMyOrders,
  loginAccount,
  registerUser,
} from '../services/api';
import lambangBunga from '../assets/admin/icons/lambang-bunga.svg';

function formatOrderDate(value) {
  const timestamp = String(value || '');
  const normalized = timestamp.includes('T') ? timestamp : `${timestamp.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString('id-ID');
}

export function UserAuthPage({
  mode,
  user,
  settings,
  onBack,
  onModeChange,
  onLogin,
  onLogout,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [orderView, setOrderView] = useState('active');
  const activeOrders = orders.filter((order) => order.status === 'pending');
  const orderHistory = orders.filter((order) => order.status !== 'pending');
  const visibleOrders = orderView === 'active' ? activeOrders : orderHistory;

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setOrdersLoading(true);
      setOrdersError('');
    }
    try {
      const response = await fetchMyOrders();
      setOrders(response.data);
      setOrdersError('');
      setOrdersLoaded(true);
    } catch (orderError) {
      setOrdersError(
        orderError instanceof Error
          ? orderError.message
          : 'Riwayat pesanan belum dapat dimuat.',
      );
      setOrdersLoaded(true);
    } finally {
      if (showLoading) setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== 'account' || !user) return undefined;
    let active = true;
    fetchMyOrders()
      .then((response) => {
        if (!active) return;
        setOrders(response.data);
        setOrdersError('');
        setOrdersLoaded(true);
      })
      .catch((orderError) => {
        if (!active) return;
        setOrdersError(
          orderError instanceof Error
            ? orderError.message
            : 'Riwayat pesanan belum dapat dimuat.',
        );
        setOrdersLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [mode, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        await registerUser(name, email.trim(), password);
        clearUserAuthToken();
        setPassword('');
        setName('');
        setSuccess('Akun berhasil dibuat. Silakan masuk dengan akunmu.');
        onModeChange('login');
      } else {
        const account = await loginAccount(email.trim(), password);
        onLogin(account);
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : 'Akun belum dapat diproses. Silakan coba kembali.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isRegistering = mode === 'register';
  const storeName = settings?.storeName || 'Sekar';
  const storeTagline = settings?.tagline || 'Bunga untuk setiap rasa';

  return (
    <main className="user-auth">
      <header className="user-auth__topbar">
        <button type="button" className="user-auth__back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke toko
        </button>
        <a className="user-auth__brand" href="#beranda" onClick={onBack}>
          <img src={lambangBunga} alt="" width={20} height={29} />
          <span>{storeName.toLowerCase()}.</span>
        </a>
        <span className="user-auth__top-note">{storeTagline}</span>
      </header>

      <section className="user-auth__content">
        {mode === 'account' && user ? (
          <div className="user-auth__card user-auth__account">
            <div className="user-auth__mark"><UserRound size={28} /></div>
            <p className="user-auth__eyebrow">AKUN {storeName.toLocaleUpperCase('id-ID')}</p>
            <h1>Halo, {user.name}.</h1>
            <p className="user-auth__subtitle">
              Kamu sudah masuk dan siap memilih bunga untuk momen istimewa.
            </p>
            <div className="user-auth__identity">
              <span>Alamat email</span>
              <strong>{user.email}</strong>
            </div>
            <section className="user-order-history" aria-labelledby="user-order-history-title">
              <div className="user-order-history__heading">
                <div>
                  <h2 id="user-order-history-title"><PackageCheck size={18} /> Pesanan saya</h2>
                  <p>Pantau pesanan aktif dan lihat pesanan yang sudah selesai.</p>
                </div>
                <button type="button" onClick={loadOrders} disabled={ordersLoading} aria-label="Muat ulang pesanan">
                  <RefreshCw size={15} /> Muat ulang
                </button>
              </div>
              <div className="user-order-history__tabs" role="group" aria-label="Kelompok pesanan">
                <button
                  type="button"
                  aria-pressed={orderView === 'active'}
                  className={orderView === 'active' ? 'is-selected' : ''}
                  onClick={() => setOrderView('active')}
                >
                  <Clock3 size={16} /> Pesanan aktif <span>{activeOrders.length}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={orderView === 'history'}
                  className={orderView === 'history' ? 'is-selected' : ''}
                  onClick={() => setOrderView('history')}
                >
                  <CircleCheck size={16} /> Riwayat selesai <span>{orderHistory.length}</span>
                </button>
              </div>
              {ordersLoading || !ordersLoaded ? (
                <p className="user-order-history__state" role="status">Memuat riwayat pesanan...</p>
              ) : ordersError ? (
                <p className="user-order-history__state user-order-history__state--error" role="alert">
                  {ordersError}
                </p>
              ) : visibleOrders.length ? (
                <div className="user-order-history__list">
                  {visibleOrders.map((order) => (
                    <article className="user-order-card" key={order.id}>
                      <header>
                        <div>
                          <strong>Pesanan #{order.id.slice(0, 8).toUpperCase()}</strong>
                          <small>{formatOrderDate(order.createdAt)}</small>
                        </div>
                        <span className={`user-order-status user-order-status--${order.status}`}>
                          {order.status === 'confirmed' ? 'Dikonfirmasi' : order.status === 'rejected' ? 'Ditolak' : 'Menunggu konfirmasi'}
                        </span>
                      </header>
                      <p className="user-order-card__delivery">
                        {order.deliveryMethod === 'pickup' ? <MapPin size={15} /> : <Truck size={15} />}
                        {order.deliveryMethod === 'pickup' ? 'Ambil di studio' : 'Kirim ke alamat'}
                      </p>
                      {order.address && <p className="user-order-card__address">{order.address}</p>}
                      <ul>
                        {order.items.map((item) => (
                          <li key={item.productId}>
                            <span>{item.name} × {item.quantity}</span>
                            <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.lineTotal)}</strong>
                          </li>
                        ))}
                      </ul>
                      <footer><span>Total pesanan</span><strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.subtotal)}</strong></footer>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="user-order-history__state">
                  {orderView === 'active'
                    ? 'Tidak ada pesanan aktif. Pesanan yang menunggu konfirmasi toko akan muncul di sini.'
                    : 'Belum ada pesanan yang selesai diproses.'}
                </p>
              )}
            </section>
            <button type="button" className="user-auth__submit user-auth__logout" onClick={onLogout}>
              <LogOut size={17} /> Keluar dari akun
            </button>
            <button type="button" className="user-auth__switch" onClick={onBack}>
              Lanjut melihat katalog
            </button>
          </div>
        ) : (
          <div className="user-auth__card">
            <div className="user-auth__mark"><Flower2 size={29} strokeWidth={1.5} /></div>
            <p className="user-auth__eyebrow">
              {isRegistering ? `GABUNG BERSAMA ${storeName.toLocaleUpperCase('id-ID')}` : 'SELAMAT DATANG KEMBALI'}
            </p>
            <h1>{isRegistering ? 'Buat akunmu.' : `Masuk ke ${storeName}.`}</h1>
            <p className="user-auth__subtitle">
              {isRegistering
                ? 'Buat akun untuk menikmati pengalaman belanja yang lebih personal.'
                : `Masuk untuk melanjutkan pengalaman istimewamu bersama ${storeName}.`}
            </p>

            <form className="user-auth__form" onSubmit={handleSubmit}>
              {isRegistering && (
                <label>
                  <span>Nama lengkap</span>
                  <span className="user-auth__input">
                    <UserRound size={18} aria-hidden="true" />
                    <input
                      type="text"
                      autoComplete="name"
                      minLength={2}
                      maxLength={80}
                      placeholder="Nama kamu"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </span>
                </label>
              )}
              <label>
                <span>Email</span>
                <span className="user-auth__input">
                  <Mail size={18} aria-hidden="true" />
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </span>
              </label>
              <label>
                <span>Kata sandi</span>
                <span className="user-auth__input">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                    minLength={isRegistering ? 8 : undefined}
                    maxLength={72}
                    placeholder={isRegistering ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="user-auth__toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              {error && <p className="user-auth__error" role="alert">{error}</p>}
              {success && <p className="user-auth__success" role="status">{success}</p>}
              <button type="submit" className="user-auth__submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Mohon tunggu...'
                  : isRegistering
                    ? 'Buat akun'
                    : 'Masuk'}
                <ArrowRight size={17} />
              </button>
            </form>

            <p className="user-auth__switch">
              {isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  onModeChange(isRegistering ? 'login' : 'register');
                }}
              >
                {isRegistering ? 'Masuk' : 'Daftar sekarang'}
              </button>
            </p>
          </div>
        )}
        <p className="user-auth__footnote">
          {storeTagline}
        </p>
      </section>
    </main>
  );
}
