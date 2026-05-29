CREATE OR REPLACE FUNCTION public.get_building_contact(
  p_building_id uuid,
  p_contact_type text,
  p_prefix text
)
RETURNS TABLE (
  address text,
  city text,
  "callQueueId" uuid,
  "buildingId" uuid,
  "ownerId" uuid,
  "contactId" uuid,
  "phoneNumber" text
)
LANGUAGE sql
AS $$
  SELECT
    CONCAT_WS(' ',ba."type_full", ba."street", ' ', ba."number") AS address, 
    ba.city AS city,
    cq.id AS "callQueueId",
    cq.building_id AS "buildingId",
    cq.owner_id AS "ownerId",
    cq.contact_id AS "contactId",
    p_prefix::text || cq.phone::text AS "phoneNumber"
  FROM public.call_queue cq  
  INNER JOIN public.building b ON b.id = cq.building_id   
  INNER JOIN public.building_address ba ON ba.id = b."addressId"           
  WHERE cq.building_id = p_building_id
    AND cq.contact_type = p_contact_type
    AND cq.can_call = true
    AND cq.status = 'PENDING'
    AND (cq.last_called_at IS NULL OR cq.last_called_at::date <> CURRENT_DATE)
    ORDER BY cq.last_called_at ASC NULLS FIRST, cq.id ASC
  LIMIT 1;
$$;

SELECT * FROM public.get_building_contact ('0d8fd5bb-206f-4b3b-b709-c947d28a516d','PRINCIPAL')



