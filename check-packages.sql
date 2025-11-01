-- Check all packages in database
SELECT 
  id,
  name,
  status,
  is_popular,
  min_investment,
  max_investment,
  daily_return_percentage,
  sort_order
FROM packages
ORDER BY sort_order;
