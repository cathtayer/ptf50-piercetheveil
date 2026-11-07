import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAvailableSlots,
  listServices,
  requestAppointment,
} from "../features/appointments/appointmentService";
import { toUserMessage } from "../services/api";

// Active services for the booking page.
export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listServices()
      .then((data) => {
        if (!cancelled) setServices(data ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          setServices([]);
          setError(toUserMessage(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { services, loading, error, reload };
}

// Open slots between `from` and `to` (Date objects or ISO strings).
// The range is tracked by timestamp, so passing a new Date object with the same time does not refetch.
export function useAvailableSlots(from, to) {
  const fromMs = from ? new Date(from).getTime() : NaN;
  const toMs = to ? new Date(to).getTime() : NaN;
  const valid = !Number.isNaN(fromMs) && !Number.isNaN(toMs);

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(valid);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!valid) {
      setSlots([]);
      setError("");
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    getAvailableSlots(new Date(fromMs), new Date(toMs))
      .then((data) => {
        if (!cancelled) setSlots(data ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          setSlots([]);
          setError(toUserMessage(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [valid, fromMs, toMs, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { slots, loading, error, reload };
}

// Sends a booking request. `request(input)` never throws: it resolves to
// { ok: true, id, reference } on success or { ok: false, message } on failure.
export function useRequestAppointment() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const [reference, setReference] = useState("");
  const mountedRef = useRef(true);
  const busyRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const request = useCallback(async (input) => {
    if (busyRef.current) {
      return { ok: false, message: "Your request is already being sent." };
    }
    busyRef.current = true;
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const { id, reference: code } = await requestAppointment(input);
      if (mountedRef.current) {
        setAppointmentId(id);
        setReference(code);
        setSuccess(true);
      }
      return { ok: true, id, reference: code };
    } catch (e) {
      const message = toUserMessage(e);
      if (mountedRef.current) setError(message);
      return { ok: false, message };
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError("");
    setSuccess(false);
    setAppointmentId(null);
    setReference("");
  }, []);

  return { request, submitting, error, success, appointmentId, reference, reset };
}
