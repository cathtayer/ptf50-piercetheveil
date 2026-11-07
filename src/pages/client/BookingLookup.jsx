import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHero from "../../components/client/PageHero";
import { cancelBooking, getBooking } from "../../features/appointments/appointmentService";
import { STATUS_LABEL } from "../../features/appointments/appointmentStatus";
import { formatReference } from "../../features/appointments/appointmentValidation";
import { formatManila, toUserMessage } from "../../services/api";

// Guests have no accounts: they find their booking with the reference code + the phone number they booked with.
export default function BookingLookup() {
  const [params] = useSearchParams();
  const [reference, setReference] = useState(params.get("ref") ?? "");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const data = await getBooking({ reference, phone });
    setBooking(data);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    setBooking(null);
    try {
      await load();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (busy || !window.confirm("Cancel this appointment request?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await cancelBooking({ reference, phone });
      await load();
      setMessage("Your appointment has been cancelled.");
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const canCancel = booking && (booking.status === "PENDING" || booking.status === "APPROVED");

  return (
    <main>
      <PageHero eyebrow="Your appointment" title={<>Check your <em>booking.</em></>}>
        Enter the reference code you received when you sent your request, and the mobile number you booked with.
      </PageHero>

      <section className="page-body">
        <form className="stylist-form" onSubmit={submit} noValidate>
          <label className="field"><span>Reference code</span>
            <input type="text" autoCapitalize="characters" autoComplete="off" maxLength={12} placeholder="ABCD-2345"
              value={reference} onChange={(e) => setReference(e.target.value)} disabled={busy} />
          </label>
          <label className="field"><span>Mobile number</span>
            <input type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="0917 123 4567"
              value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} />
          </label>
          <div className="stylist-form__actions">
            <button className="button button--dark" type="submit" disabled={busy || !reference.trim() || !phone.trim()} aria-busy={busy}>
              {busy ? "Checking…" : "Find my booking"}
            </button>
          </div>
        </form>

        {error && <p className="callout callout--error" role="alert">{error}</p>}
        {message && <p className="callout" role="status">{message}</p>}

        {booking && (
          <div className="lookup-result">
            <p className="lookup-result__status">{STATUS_LABEL[booking.status] ?? booking.status}</p>
            <dl className="detail__facts">
              <div><dt>Reference</dt><dd>{formatReference(booking.reference)}</dd></div>
              <div><dt>Service</dt><dd>{booking.serviceName}</dd></div>
              <div><dt>Date and time</dt><dd>{formatManila(booking.startsAt)}</dd></div>
            </dl>
            {booking.status === "PENDING" && <p className="detail__note">The shop has not confirmed this yet. They will contact you.</p>}
            {canCancel ? (
              <button className="button button--dark" type="button" onClick={cancel} disabled={busy}>Cancel this appointment</button>
            ) : (
              <p className="detail__note">This appointment can no longer be changed online. Message the shop if you need help.</p>
            )}
          </div>
        )}

        <p className="detail__note">Lost your code? <a className="link-button" href="https://www.instagram.com/piercetheveil.ac/" target="_blank" rel="noreferrer">Message @piercetheveil.ac</a> or <Link className="link-button" to="/availability">send a new request</Link>.</p>
      </section>
    </main>
  );
}
