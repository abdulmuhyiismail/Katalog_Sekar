import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  MessageCircle,
  Truck,
  MapPin,
  X,
} from 'lucide-react';
import fotoBunga0 from '../assets/admin/images/foto-bunga0.png';
import fotoBunga1 from '../assets/admin/images/foto-bunga1.png';
import fotoBunga2 from '../assets/admin/images/foto-bunga2.png';
import fotoBunga3 from '../assets/admin/images/foto-bunga3.png';
import fotoBunga4 from '../assets/admin/images/foto-bunga4.png';
import fotoBunga5 from '../assets/admin/images/foto-bunga5.png';
import fotoBunga6 from '../assets/admin/images/foto-bunga6.png';
import fotoBunga7 from '../assets/admin/images/foto-bunga7.png';

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

function imageSource(product) {
  const image = product.image;
  if (image && !image.startsWith('/images/')) {
    if (/^https?:\/\//i.test(image) || image.startsWith('/')) return image;
    return `/uploads/${encodeURIComponent(image)}`;
  }
  return seededProductImages[product.name] || image || '/images/hero-bouquet.jpg';
}

export function OrderModal({ items, product, settings, initialNote = '', onClose }) {
  const orderItems = useMemo(
    () => items?.length ? items : product ? [{ product, quantity: 1 }] : [],
    [items, product],
  );
  const [form, setForm] = useState({
    name: '',
    delivery: 'delivery',
    address: '',
    note: initialNote,
  });
  const [error, setError] = useState('');
  const subtotal = orderItems.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0,
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const message = useMemo(() => {
    const pickup = form.delivery === 'pickup';
    return [
      'Halo Sekar, saya ingin memesan:',
      '',
      ...orderItems.flatMap(({ product: item, quantity }) => [
        item.name,
        `Jumlah: ${quantity} rangkaian`,
        `Harga satuan: ${formatPrice(item.price)}`,
        '',
      ]),
      `Subtotal: ${formatPrice(subtotal)}`,
      '',
      `Nama: ${form.name || '-'}`,
      `Metode: ${pickup ? 'Ambil di studio' : 'Kirim ke alamat'}`,
      ...(!pickup ? [`Alamat: ${form.address || '-'}`] : []),
      ...(form.note.trim() ? [`Ucapan: ${form.note.trim()}`] : []),
      '',
      'Mohon konfirmasi ketersediaan, ongkir, dan jadwal pengirimannya. Terima kasih!',
    ].join('\n');
  }, [form, orderItems, subtotal]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submitOrder(event) {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Nama pemesan perlu diisi.');
      return;
    }
    if (form.delivery === 'delivery' && !form.address.trim()) {
      setError('Alamat pengiriman perlu diisi.');
      return;
    }

    let phone = String(settings?.phone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
    if (
      settings?.activeWhatsApp === false ||
      String(settings?.activeWhatsApp).toLowerCase() === 'false' ||
      phone.length < 9
    ) {
      setError('Nomor WhatsApp toko belum tersedia. Silakan hubungi toko secara langsung.');
      return;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const opened = window.open(url, '_blank');
    if (opened) opened.opener = null;
    else window.location.assign(url);
    onClose();
  }

  return (
    <div
      className="order-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="order-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
      >
        <header className="order-dialog__header">
          <div>
            <p>Rangkai pesananmu</p>
            <h2 id="order-title">Sedikit lagi, bungamu siap dipesan.</h2>
            <span>Lengkapi detail berikut. Florist kami akan mengonfirmasi pesanan melalui WhatsApp.</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </header>

        <div className="order-dialog__body">
          <form className="order-form" onSubmit={submitOrder} noValidate>
            {orderItems.map(({ product: item, quantity }) => (
              <article className="order-selected-product" key={item.id}>
                <img src={imageSource(item)} alt={item.name} />
                <div>
                  <span>{item.categoryName || 'Buket bunga'}</span>
                  <strong>{item.name}</strong>
                  <small>{quantity} rangkaian · {formatPrice(Number(item.price) * quantity)}</small>
                </div>
              </article>
            ))}

            <label className="order-field">
              <span>Nama pemesan <b>*</b></span>
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Contoh: Nadia Putri"
                autoComplete="name"
                required
              />
            </label>

            <fieldset className="order-delivery-options">
              <legend>Metode penerimaan <b>*</b></legend>
              <label className={form.delivery === 'delivery' ? 'is-selected' : ''}>
                <input
                  type="radio"
                  name="delivery"
                  value="delivery"
                  checked={form.delivery === 'delivery'}
                  onChange={updateField}
                />
                <Truck size={18} />
                <span>Kirim ke alamat</span>
                {form.delivery === 'delivery' && <Check size={15} />}
              </label>
              <label className={form.delivery === 'pickup' ? 'is-selected' : ''}>
                <input
                  type="radio"
                  name="delivery"
                  value="pickup"
                  checked={form.delivery === 'pickup'}
                  onChange={updateField}
                />
                <MapPin size={18} />
                <span>Ambil di studio</span>
                {form.delivery === 'pickup' && <Check size={15} />}
              </label>
            </fieldset>

            {form.delivery === 'delivery' && (
              <label className="order-field">
                <span>Alamat pengiriman <b>*</b></span>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  placeholder="Nama jalan, nomor, kecamatan, kota, dan patokan"
                  rows={3}
                  required
                />
              </label>
            )}

            <label className="order-field">
              <span>Catatan / ucapan <small>(opsional)</small></span>
              <textarea
                name="note"
                value={form.note}
                onChange={updateField}
                placeholder="Pesan kartu ucapan atau kebutuhan khusus"
                rows={3}
              />
            </label>

            {error && <p className="order-error" role="alert">{error}</p>}
            <p className="order-form__privacy">* Wajib diisi. Ongkir dan jadwal pengiriman akan dikonfirmasi oleh florist.</p>
            <div className="order-form__actions">
              <button type="button" className="store-button secondary" onClick={onClose}>Batal</button>
              <button className="store-button" type="submit"><MessageCircle size={16} /> Kirim Pesanan ke WhatsApp</button>
            </div>
          </form>

          <aside className="order-preview">
            <h3><MessageCircle size={17} /> Pratinjau pesan WhatsApp</h3>
            <p>Pesan berikut disiapkan dari detail pesananmu.</p>
            <div className="order-preview__message">
              {message.split('\n').map((line, index) => (
                <span key={`${index}-${line}`}>{line || '\u00a0'}</span>
              ))}
            </div>
            <div className="order-preview__total">
              <span>Subtotal · {orderItems.reduce((total, item) => total + item.quantity, 0)} rangkaian</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <small>Belum termasuk ongkir. Tidak ada pembayaran di tahap ini.</small>
          </aside>
        </div>
      </section>
    </div>
  );
}
