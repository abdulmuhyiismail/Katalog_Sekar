import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Flower2,
  LogOut,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react';
import {
  clearUserAuthToken,
  loginAccount,
  registerUser,
} from '../services/api';
import lambangBunga from '../assets/admin/icons/lambang-bunga.svg';

export function UserAuthPage({
  mode,
  user,
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

  return (
    <main className="user-auth">
      <header className="user-auth__topbar">
        <button type="button" className="user-auth__back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke toko
        </button>
        <a className="user-auth__brand" href="#beranda" onClick={onBack}>
          <img src={lambangBunga} alt="" width={20} height={29} />
          <span>sekar.</span>
        </a>
        <span className="user-auth__top-note">Bunga untuk setiap rasa</span>
      </header>

      <section className="user-auth__content">
        {mode === 'account' && user ? (
          <div className="user-auth__card user-auth__account">
            <div className="user-auth__mark"><UserRound size={28} /></div>
            <p className="user-auth__eyebrow">AKUN SEKAR</p>
            <h1>Halo, {user.name}.</h1>
            <p className="user-auth__subtitle">
              Kamu sudah masuk dan siap memilih bunga untuk momen istimewa.
            </p>
            <div className="user-auth__identity">
              <span>Alamat email</span>
              <strong>{user.email}</strong>
            </div>
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
              {isRegistering ? 'GABUNG BERSAMA SEKAR' : 'SELAMAT DATANG KEMBALI'}
            </p>
            <h1>{isRegistering ? 'Buat akunmu.' : 'Masuk ke Sekar.'}</h1>
            <p className="user-auth__subtitle">
              {isRegistering
                ? 'Buat akun untuk menikmati pengalaman belanja yang lebih personal.'
                : 'Masuk untuk melanjutkan pengalaman istimewamu bersama Sekar.'}
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
          Dirangkai dengan hati, untuk setiap cerita.
        </p>
      </section>
    </main>
  );
}
