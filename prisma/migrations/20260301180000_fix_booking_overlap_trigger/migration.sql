-- Fix check_booking_overlap(): unquoted identifiers were being folded to
-- lowercase by Postgres (deskid/starttime/endtime), which don't match the
-- actual camelCase quoted columns. This made every booking insert fail and
-- silently fall back to mock/offline booking storage in the app.
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE "deskId" = NEW."deskId"
    AND status = 'CONFIRMED'
    AND id != COALESCE(NEW.id, '')
    AND (
      (NEW."startTime" < "endTime" AND NEW."endTime" > "startTime")
    )
  ) THEN
    RAISE EXCEPTION 'Desk is already booked for this time period';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
