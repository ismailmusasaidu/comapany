/*
# Quotation & Booking Workflow — Part 3: Scheduled expiry job

Schedules expire_quotations() to run every 15 minutes via pg_cron so quotation
expiry is enforced by the server, independent of any browser.
*/

SELECT cron.schedule('expire-logistics-quotations', '*/15 * * * *', 'SELECT public.expire_quotations()');
