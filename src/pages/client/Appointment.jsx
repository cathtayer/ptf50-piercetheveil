import { useMemo, useState } from "react";
import Footer from "../../components/client/Footer";
import Navbar from "../../components/client/Navbar";

const services = [
  { name: "Lobe", price: 100, duration: 30 },
  { name: "Helix", price: 170, duration: 40 },
  { name: "Conch", price: 200, duration: 40 },
  { name: "Flat", price: 200, duration: 40 },
  { name: "Septum", price: 400, duration: 45 },
  { name: "Eyebrow", price: 350, duration: 45 },
  { name: "Labret", price: 350, duration: 45 },
  { name: "Navel", price: 450, duration: 50 },
];

const slotsByDay = {
  0: ["11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"],
  2: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"],
  3: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"],
  4: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"],
  5: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM", "7:00 PM"],
  6: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM", "7:00 PM"],
};

const unavailableSlots = {
  2: ["12:00 PM"],
  4: ["4:00 PM"],
  6: ["2:00 PM", "6:00 PM"],
};

function getToday() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return today;
}

function getFirstAvailableDate() {
  const date = getToday();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 1) date.setDate(date.getDate() + 1);
  return date;
}

function makeCalendarDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const cursor = new Date(first);
  cursor.setDate(1 - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + index);
    return date;
  });
}

function isSameDate(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function formatDate(date, options) {
  return new Intl.DateTimeFormat("en-PH", options).format(date);
}

export default function Appointment() {
  const today = useMemo(getToday, []);
  const lastBookableDate = useMemo(() => {
    const date = getToday();
    date.setDate(date.getDate() + 60);
    return date;
  }, []);
  const firstAvailableDate = useMemo(getFirstAvailableDate, []);
  const [service, setService] = useState(services[0]);
  const [selectedDate, setSelectedDate] = useState(firstAvailableDate);
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(firstAvailableDate.getFullYear(), firstAvailableDate.getMonth(), 1, 12),
  );
  const [selectedTime, setSelectedTime] = useState("");
  const [visitType, setVisitType] = useState("address");
  const [notice, setNotice] = useState("");

  const daySlots = slotsByDay[selectedDate.getDay()] || [];
  const unavailable = unavailableSlots[selectedDate.getDay()] || [];
  const calendarDays = useMemo(() => makeCalendarDays(calendarMonth), [calendarMonth]);
  const firstCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  const lastCalendarMonth = new Date(lastBookableDate.getFullYear(), lastBookableDate.getMonth(), 1, 12);
  const canGoBack = calendarMonth > firstCalendarMonth;
  const canGoForward = calendarMonth < lastCalendarMonth;

  const selectDate = (date) => {
    setSelectedDate(date);
    setSelectedTime("");
    setNotice("");
  };

  const moveMonth = (amount) => {
    setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + amount, 1, 12));
  };

  const continueRequest = () => {
    if (!selectedTime) {
      setNotice("Choose an available time to continue.");
      return;
    }
    setNotice("Your selection is ready. The request form will be enabled when the booking API is connected.");
  };

  return (
    <div className="page-shell availability-page">
      <Navbar />

      <main>
        <section className="availability-hero">
          <div className="availability-hero__texture" />
          <div className="availability-hero__copy">
            <p className="eyebrow"><span /> Appointment preview · Angeles City</p>
            <h1>Find a time<br /><em>that feels right.</em></h1>
            <p>
              Check upcoming client-address availability and announced pop-up dates.
              Final timing and location are confirmed personally before your appointment.
            </p>
          </div>

          <aside className="availability-hero__note">
            <span>Good to know</span>
            <p>Pierce the Veil is an independent mobile and pop-up piercing business—there is no permanent studio location.</p>
          </aside>
        </section>

        <section className="availability-workspace">
          <div className="availability-intro">
            <div>
              <p className="eyebrow eyebrow--dark"><span /> Check availability</p>
              <h2>Plan your <em>appointment.</em></h2>
            </div>
            <p>Select a service, preferred date, and open time. This screen currently uses preview availability until the admin schedule API is connected.</p>
          </div>

          <div className="availability-layout">
            <div className="availability-flow">
              <section className="availability-step" aria-labelledby="service-step">
                <div className="availability-step__heading">
                  <span>01</span>
                  <div><h3 id="service-step">Choose a piercing</h3><p>Pricing is based on the current service guide.</p></div>
                </div>
                <div className="service-options">
                  {services.map((item) => (
                    <button
                      className={service.name === item.name ? "active" : ""}
                      key={item.name}
                      type="button"
                      onClick={() => { setService(item); setNotice(""); }}
                    >
                      <span>{item.name}</span>
                      <small>from ₱{item.price} · {item.duration} min</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="availability-step" aria-labelledby="date-step">
                <div className="availability-step__heading">
                  <span>02</span>
                  <div><h3 id="date-step">Pick a date</h3><p>Mondays are unavailable.</p></div>
                </div>
                <div className="booking-calendar">
                  <div className="booking-calendar__header">
                    <button
                      aria-label="Previous month"
                      disabled={!canGoBack}
                      onClick={() => moveMonth(-1)}
                      type="button"
                    >
                      ←
                    </button>
                    <strong>{formatDate(calendarMonth, { month: "long", year: "numeric" })}</strong>
                    <button
                      aria-label="Next month"
                      disabled={!canGoForward}
                      onClick={() => moveMonth(1)}
                      type="button"
                    >
                      →
                    </button>
                  </div>

                  <div className="booking-calendar__weekdays" aria-hidden="true">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
                  </div>

                  <div className="booking-calendar__days">
                    {calendarDays.map((date) => {
                      const outsideMonth = date.getMonth() !== calendarMonth.getMonth();
                      const unavailableDay = date <= today || date > lastBookableDate || date.getDay() === 1 || outsideMonth;
                      const active = isSameDate(date, selectedDate);

                      return (
                        <button
                          aria-label={`${formatDate(date, { weekday: "long", month: "long", day: "numeric" })}${unavailableDay ? ', unavailable' : ''}`}
                          className={`${active ? "active" : ""} ${outsideMonth ? "outside" : ""}`}
                          disabled={unavailableDay}
                          key={date.toISOString()}
                          onClick={() => selectDate(date)}
                          type="button"
                        >
                          <span>{date.getDate()}</span>
                          {!unavailableDay && <small>Open</small>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="booking-calendar__legend">
                    <span><i className="booking-calendar__dot booking-calendar__dot--open" /> Available</span>
                    <span><i className="booking-calendar__dot booking-calendar__dot--selected" /> Selected</span>
                    <span><i className="booking-calendar__dot" /> Unavailable</span>
                  </div>
                </div>
              </section>

              <section className="availability-step" aria-labelledby="time-step">
                <div className="availability-step__heading">
                  <span>03</span>
                  <div>
                    <h3 id="time-step">Choose a time</h3>
                    <p>{formatDate(selectedDate, { weekday: "long", month: "long", day: "numeric" })}</p>
                  </div>
                </div>
                <div className="time-options">
                  {daySlots.map((time) => {
                    const disabled = unavailable.includes(time);
                    return (
                      <button
                        className={selectedTime === time ? "active" : ""}
                        disabled={disabled}
                        key={time}
                        type="button"
                        onClick={() => { setSelectedTime(time); setNotice(""); }}
                      >
                        {time}<small>{disabled ? "Taken" : "Available"}</small>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="availability-step" aria-labelledby="visit-step">
                <div className="availability-step__heading">
                  <span>04</span>
                  <div><h3 id="visit-step">Appointment setting</h3><p>Exact details are confirmed after the request.</p></div>
                </div>
                <div className="visit-options">
                  <button className={visitType === "address" ? "active" : ""} type="button" onClick={() => setVisitType("address")}>
                    <span>Client address</span>
                    <small>Select areas around Angeles City · subject to setup review</small>
                  </button>
                  <button className={visitType === "popup" ? "active" : ""} type="button" onClick={() => setVisitType("popup")}>
                    <span>Pop-up booth</span>
                    <small>No announced booth for this preview date · check Instagram for updates</small>
                  </button>
                </div>
              </section>
            </div>

            <aside className="booking-summary">
              <p className="booking-summary__eyebrow">Your selection</p>
              <h3>Appointment summary</h3>
              <dl>
                <div><dt>Service</dt><dd>{service.name}</dd></div>
                <div><dt>Starting price</dt><dd>₱{service.price}</dd></div>
                <div><dt>Date</dt><dd>{formatDate(selectedDate, { month: "short", day: "numeric", year: "numeric" })}</dd></div>
                <div><dt>Time</dt><dd>{selectedTime || "Not selected"}</dd></div>
                <div><dt>Setting</dt><dd>{visitType === "address" ? "Client address" : "Pop-up booth"}</dd></div>
              </dl>
              <div className="booking-summary__message">
                <strong>Final confirmation required</strong>
                <p>Jewelry choice, anatomy, address suitability, travel details, and final total are reviewed before approval.</p>
              </div>
              <button className="booking-summary__cta" type="button" onClick={continueRequest}>Continue to request <span>→</span></button>
              {notice && <p className="booking-summary__notice" role="status">{notice}</p>}
              <a href="https://www.instagram.com/piercetheveil.ac/" target="_blank" rel="noreferrer">Questions? Message @piercetheveil.ac</a>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
