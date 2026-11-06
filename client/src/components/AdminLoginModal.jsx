import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { loginAdmin } from '../services/api';
import lambangBunga from '../assets/admin/icons/lambang-bunga.svg';

export function AdminLoginModal({ onBack, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await loginAdmin(email.trim(), password);
      onLogin(user);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Tidak dapat masuk. Periksa kembali email dan kata sandi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login">
      <header className="admin-login__topbar">
        <button type="button" className="admin-login__back" onClick={onBack}>
          <ArrowLeft size={17} /> Kembali
        </button>
        <a className="admin-login__brand" href="#beranda" onClick={onBack}>
          <img src={lambangBunga} alt="" width={20} height={29} />
          <span>sekar.</span>
        </a>
      </header>

      <section className="admin-login__content">
        <div className="admin-login__card">
          <h1>Masuk ke Dashboard</h1>
          <p className="admin-login__subtitle">Gunakan akun administrator untuk melanjutkan.</p>

          <form onSubmit={handleSubmit} className="admin-login__form">
            <label>
              <span>Email</span>
              <span className="admin-login__input">
                <Mail size={16} aria-hidden="true" />
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </span>
            </label>
            <label>
              <span className="admin-login__password-label">
                Kata sandi
              </span>
              <span className="admin-login__input">
                <LockKeyhole size={16} aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="admin-login__toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            {error && <p className="admin-login__error" role="alert">{error}</p>}
            <button type="submit" className="admin-login__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Memeriksa akun...' : 'Masuk'}
              <ArrowRight size={16} />
            </button>
          </form>

          <button type="button" className="admin-login__return" onClick={onBack}>
            <ArrowLeft size={14} /> Kembali ke toko
          </button>
        </div>
      </section>

      <footer className="admin-login__footer">© 2026 Sekar Florist</footer>
    </main>
  );
}
