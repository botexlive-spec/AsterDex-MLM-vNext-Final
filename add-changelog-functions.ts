// Add these functions to the end of app/services/admin-commission.service.ts

/**
 * Log a commission change to the changelog
 */
export const logCommissionChange = async (change: {
  change_type: string;
  section: string;
  old_value?: any;
  new_value?: any;
  description: string;
  affected_users?: number;
}): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('commission_changelog')
      .insert([{
        changed_by: user?.id,
        change_type: change.change_type,
        section: change.section,
        old_value: change.old_value,
        new_value: change.new_value,
        description: change.description,
        affected_users: change.affected_users || 0,
      }]);

    if (error) {
      console.error('Error logging change:', error);
    }
  } catch (error: any) {
    console.error('Error logging commission change:', error);
  }
};

/**
 * Get commission changelog
 */
export const getCommissionChangelog = async (limit: number = 50): Promise<ChangelogEntry[]> => {
  try {
    await requireAdmin();

    const { data, error } = await supabase
      .from('commission_changelog')
      .select(`
        *,
        user:changed_by(email, raw_user_meta_data)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error getting changelog:', error);
    return [];
  }
};

/**
 * Get commission runs
 */
export const getCommissionRuns = async (limit: number = 50): Promise<any[]> => {
  try {
    await requireAdmin();

    const { data, error } = await supabase
      .from('commission_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error getting commission runs:', error);
    return [];
  }
};
