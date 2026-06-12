# Security Specification: MotoAssist Firestore Database

This document outlines the security invariants, payload rules, and threat vectors mapped for the MotoAssist application's Firestore collections (`motorizados` and `asistencias`).

## 1. Data Invariants & Access Models

- **Motorizados**
  - Collection: `/motorizados/{motorizadoId}`
  - Schema: `Motorizado`
  - Invariants:
    - ID must be string, size <= 128 chars, matching alphanumeric pattern: `^[a-zA-Z0-9_\-]+$`.
    - `nombre` and `telefono` are required and non-empty.
    - `estado` must be either `"Activo"` or `"Inactivo"`.
    - `asistencias_realizadas` must be an integer >= 0.
    - `total_facturado` must be a positive number or zero.

- **Asistencias**
  - Collection: `/asistencias/{asistenciaId}`
  - Schema: `Asistencia`
  - Invariants:
    - ID must follow alphanumeric pattern, size <= 128.
    - `fecha` must be a valid date string.
    - `total` must be a positive number or zero.
    - `motorizado_id` must reference a valid motorizado ID.

---

## 2. Threat Analysis: The "Dirty Dozen" Vulnerability Payloads

The following specific JSON payloads represent malicious attempts to bypass ID and data validation boundaries in the database.

1. **ID Poisoning Attack**: Attempting to inject a huge alphanumeric string (e.g., 2000 characters) as document ID to exhaust space or trigger memory pressure.
2. **Ghost Field Injection (Motorizado)**: Adding unallowed fields (e.g., `role: "admin"` or `isSystemVerified: true`) to escalade permissions.
3. **Ghost Field Injection (Asistencia)**: Attempting to insert unapproved tracking metrics inside the asistencia ticket payload.
4. **Negative Calculations**: Setting `total_facturado` to a negative amount (e.g., `-1500.00`) to manipulate reporting counters.
5. **Null Value Type Spoof**: Sending `estado: null` for Motorizado to cause type mismatches and app crashes.
6. **Missing Required Fields**: Creating a Motorizado omitting the `nombre` field.
7. **Type Coercion Failure (Motorizado)**: Submitting `asistencias_realizadas` as a string (`"five"`) instead of an integer.
8. **Value Range Overflow**: Injecting a total field exceeding normal realistic values (e.g. total of `100000000` Balboas).
9. **Invalid String Formatting**: Sending invalid status string (e.g., `estado: "Unknown"`, must be `"Activo"` or `"Inactivo"`).
10. **State Corruption (Asistencia)**: Overwriting initial timestamps (`created_at`) on update.
11. **Malicious Empty Payload**: Creating an empty doc with zero fields.
12. **Boundary Size Exhaustion**: Sending string values for `telefono` or `nombre` exceeding 10,000 characters.

---

## 3. Firestore Rules Verification

The `firestore.rules` file will be created and validated to block all Dirty Dozen payloads, returning `PERMISSION_DENIED` on each failure.
