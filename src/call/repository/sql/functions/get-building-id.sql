CREATE OR REPLACE FUNCTION get_building_id(p_city text)
RETURNS uuid AS $$
     SELECT cq.building_id
          FROM public.call_queue cq
		  INNER JOIN public.building b ON b.id = cq.building_id   
  		  INNER JOIN public.building_address ba ON ba.id = b."addressId"  
          WHERE ba.city = p_city
          AND status = 'PENDING'
          AND cq.contact_type = 'PRINCIPAL'
          ORDER BY last_called_at ASC NULLS FIRST
          LIMIT 1;
$$ LANGUAGE sql;

SELECT * FROM public.get_building_id('MADRID')


--Version completa

CREATE OR REPLACE FUNCTION public.get_building_id(p_city text)
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT cq.building_id
  FROM public.call_queue cq
  INNER JOIN public.building b ON b.id = cq.building_id
  INNER JOIN public.building_address ba ON ba.id = b."addressId"
  WHERE ba.city = p_city
    AND cq.status = 'PENDING'
    AND cq.can_call = true
    AND (cq.freeze_until IS NULL OR cq.freeze_until <= NOW())
  GROUP BY cq.building_id
  ORDER BY
    MIN(
      CASE cq.contact_type
        WHEN 'PRINCIPAL' THEN 1
        WHEN 'SECUNDARIO' THEN 2
        WHEN 'MISMA_CASA' THEN 3
        WHEN 'HERMANOS' THEN 4
        WHEN 'HIJOS' THEN 5
        WHEN 'FAMILIAR' THEN 6
        WHEN 'VECINO' THEN 7
        ELSE 8
      END
    ),
    MIN(cq.last_called_at) ASC NULLS FIRST
  LIMIT 1;
$$;