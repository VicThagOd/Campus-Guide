-- Migration: 20260923_delete_pending_pageant_contestants.sql
-- Description: Deletes all uncompleted / pending pageant registrations from pageant_contestants and creates a cleanup stored procedure.

-- 1. Delete all existing uncompleted / pending records from pageant_contestants
DELETE FROM public.pageant_contestants
WHERE payment_status != 'completed' 
   OR payment_reference IS NULL;

-- 2. Create a maintenance function to purge any uncompleted contestant entries
CREATE OR REPLACE FUNCTION public.cleanup_pending_pageant_contestants()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.pageant_contestants
    WHERE payment_status != 'completed'
       OR payment_reference IS NULL;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted_count', v_deleted);
END;
$$;
