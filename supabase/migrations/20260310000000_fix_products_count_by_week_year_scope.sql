-- Fix get_products_count_by_week to scope product counts by actual launch date
-- range instead of bare week number.
--
-- The previous implementation joined on `products.week = weeks.week_number`,
-- which is a per-year value (1–52). This caused every future week to
-- accumulate counts from the same-numbered week in all previous years, making
-- all slots appear full and breaking free-queue placement.
--
-- The fix joins on the week's real date window so only products whose
-- launch_start falls inside that specific week are counted.

CREATE OR REPLACE FUNCTION public.get_products_count_by_week(
  start_week integer,
  end_week   integer,
  year_in    integer,
  start_day  integer
)
RETURNS TABLE(
  week_number   integer,
  start_date    timestamp with time zone,
  end_date      timestamp with time zone,
  product_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    weeks.week_number,
    weeks.start_date,
    weeks.end_date,
    COALESCE(COUNT(products.id), 0)::integer AS product_count
  FROM
    generate_series(start_week, end_week) AS week_series(series)
  JOIN get_weeks(year_in, start_day) AS weeks
    ON weeks.week_number = week_series.series
  LEFT JOIN public.products
    ON  products.launch_start >= weeks.start_date
    AND products.launch_start <= weeks.end_date
    AND products.deleted = false
  GROUP BY
    weeks.week_number,
    weeks.start_date,
    weeks.end_date
  ORDER BY
    weeks.week_number;
END;
$$;
